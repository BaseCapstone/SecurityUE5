#include "AntiCheatDataCollector.h"
#include "AntiCheatDataSender.h"
#include "AntiCheatVulnerabilityComponent.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/PlayerState.h" 
#include "JsonObjectConverter.h"      
#include "GameFramework/Pawn.h"
#include "Engine/Engine.h"
#include "Engine/World.h"
#include "GameFramework/Actor.h"
#include "TimerManager.h"
#include "Kismet/GameplayStatics.h"
#include "Character/LyraHealthComponent.h" 
#include "CollisionQueryParams.h"
#include "EngineUtils.h"
#include "GameFramework/GameStateBase.h"
#include "AbilitySystemComponent.h"
#include "AbilitySystemGlobals.h"
#include "GameplayTagContainer.h"
#include "Misc/CommandLine.h"
#include "Misc/Parse.h"
#include "GenericPlatform/GenericPlatformHttp.h"

UAntiCheatDataCollector::UAntiCheatDataCollector()
{
    PrimaryComponentTick.bCanEverTick = false;
    LastControlRotation = FRotator::ZeroRotator;
}

void UAntiCheatDataCollector::BeginPlay()
{
    Super::BeginPlay();

    DataSender = NewObject<UAntiCheatDataSender>(this);

    FParse::Value(FCommandLine::Get(), TEXT("GameUserId="), LinkedUserID);
    FParse::Value(FCommandLine::Get(), TEXT("GameAuthToken="), GameAuthToken);
    FParse::Value(FCommandLine::Get(), TEXT("GameLogEndpoint="), GameLogEndpoint);

    if (!GameLogEndpoint.IsEmpty())
    {
        AWSEndpointURL = FGenericPlatformHttp::UrlDecode(GameLogEndpoint);
    }

    if (LinkedUserID.IsEmpty())
    {
        LinkedUserID = TEXT("UnknownUser");
    }

    UE_LOG(LogTemp, Warning, TEXT("[AntiCheat] Launch args loaded. UserID=%s Token=%s Endpoint=%s"), *LinkedUserID, GameAuthToken.IsEmpty() ? TEXT("missing") : TEXT("present"), *AWSEndpointURL);

    // 0.1초마다 데이터 수집 실행
    if (GetWorld())
    {
        GetWorld()->GetTimerManager().SetTimer(DataTimerHandle, this, &UAntiCheatDataCollector::CollectAndlog, 0.1f, true, 1.0f);
    }
}

void UAntiCheatDataCollector::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    if (GetWorld())
    {
        GetWorld()->GetTimerManager().ClearTimer(DataTimerHandle);
    }
    Super::EndPlay(EndPlayReason);
}

void UAntiCheatDataCollector::CollectAndlog()
{
    if (!GetWorld() || GetWorld()->bIsTearingDown) return;

    // 1. 수집기가 붙어있는 캐릭터(Pawn) 가져오기
    AActor* Owner = GetOwner();
    if (!Owner) return;

    APawn* PawnOwner = Cast<APawn>(Owner);
    if (!PawnOwner) return;

    // 2. 이 캐릭터를 조종하는 컨트롤러(PC) 가져오기
    APlayerController* PC = Cast<APlayerController>(PawnOwner->GetController());
    if (!PC) return;

    // 게임 대기시간 / 정상 무적 상태 / 매치 전후에는 로그 수집 및 전송 금지
    if (!ShouldCollectTrainingLog(PawnOwner))
    {
        PacketBuffer.Reset();

        bHasLastControlRotation = false;
        LastControlRotation = FRotator::ZeroRotator;

        if (GEngine)
        {
            GEngine->AddOnScreenDebugMessage(
                2,
                0.5f,
                FColor::Yellow,
                TEXT("[AntiCheat] Waiting or DamageImmune - log collection paused")
            );
        }

        return;
    }

    // ==============================================================
    // 핵 컴포넌트는 모듈에 의해 컨트롤러(PC)에 붙어있습니다.
    // 따라서 Owner가 아닌 PC에서 찾아야 합니다.
    // ==============================================================
    int32 CurrentSpeedHack = 0;
    int32 CurrentAim = 0;
    int32 CurrentGodMode = 0;
    int32 CurrentESP = 0;

    UAntiCheatVulnerabilityComponent* VulnComp = PC->FindComponentByClass<UAntiCheatVulnerabilityComponent>();

    if (VulnComp)
    {
        CurrentSpeedHack = VulnComp->IsSpeedHackEnabled() ? 1 : 0;
        CurrentAim = VulnComp->IsAimHackEnabled() ? 1 : 0;
        CurrentGodMode = VulnComp->IsGodModeEnabled() ? 1 : 0;
        CurrentESP = VulnComp->IsESPEnabled() ? 1 : 0;
    }

    const bool bAnyHackActive =
        CurrentSpeedHack == 1 ||
        CurrentAim == 1 ||
        CurrentGodMode == 1 ||
        CurrentESP == 1;

    // 3. 데이터 패킷 구성 (기존 동일)
    FAntiCheatDataPacket DataPacket{};
    DataPacket.CurrentHP = 0.0f;
    DataPacket.UserID = LinkedUserID;
    DataPacket.Timestamp = GetWorld()->GetTimeSeconds();
    DataPacket.Location = Owner->GetActorLocation();
    DataPacket.Speed = Owner->GetVelocity().Size();

    FRotator CurrentRotation = PC->GetControlRotation();
    DataPacket.Rotation = CurrentRotation;

    if (!bHasLastControlRotation)
    {
        DataPacket.DeltaRotation = FRotator::ZeroRotator;
        bHasLastControlRotation = true;
    }
    else
    {
        FRotator Delta = CurrentRotation - LastControlRotation;
        Delta.Normalize();
        DataPacket.DeltaRotation = Delta;
    }

    LastControlRotation = CurrentRotation;

    if (const ULyraHealthComponent* HealthComp = Owner->FindComponentByClass<ULyraHealthComponent>())
    {
        DataPacket.CurrentHP = HealthComp->GetHealth();
    }

    DataPacket.TargetDistance = 0.0f;
    DataPacket.TargetAngle = 0.0f;
    DataPacket.bIsTargetVisible = false;

    AActor* BestTarget = nullptr;
    float MinDistance = 1000000.0f;

    for (TActorIterator<APawn> It(GetWorld()); It; ++It)
    {
        APawn* PotentialTarget = *It;
        if (!PotentialTarget || PotentialTarget == Owner) continue;

        float Dist = FVector::Dist(Owner->GetActorLocation(), PotentialTarget->GetActorLocation());
        if (Dist < MinDistance)
        {
            MinDistance = Dist;
            BestTarget = PotentialTarget;
        }
    }

    if (BestTarget)
    {
        DataPacket.TargetDistance = MinDistance;
        FVector DirToTarget = (BestTarget->GetActorLocation() - Owner->GetActorLocation()).GetSafeNormal();
        FVector LookDir = PC->GetControlRotation().Vector();
        float Dot = FVector::DotProduct(LookDir, DirToTarget);

        DataPacket.TargetAngle = FMath::RadiansToDegrees(FMath::Acos(FMath::Clamp(Dot, -1.0f, 1.0f)));

        FHitResult Hit;
        FCollisionQueryParams Params;
        Params.AddIgnoredActor(Owner);
        DataPacket.bIsTargetVisible = !GetWorld()->LineTraceSingleByChannel(Hit, Owner->GetActorLocation(), BestTarget->GetActorLocation(), ECC_Visibility, Params);
    }

    // 핵 종류별 활성 상태 저장
    DataPacket.SpeedHack = CurrentSpeedHack;
    DataPacket.Aim = CurrentAim;
    DataPacket.GodMode = CurrentGodMode;
    DataPacket.ESP = CurrentESP;

    PacketBuffer.Add(DataPacket);

    // 버퍼 전송 (AWS)
    if (PacketBuffer.Num() >= MaxBufferSize) // MaxBufferSize(30)
    {
        if (DataSender)
        {
            DataSender->SendDataToAWS(PacketBuffer, AWSEndpointURL, GameAuthToken); // AWSEndpointURL 변수가 헤더에 있어야 함
        }
        PacketBuffer.Reset();
    }

    // 실시간 디버그 로그 출력 (Realtime Data)
    // 함수 맨 마지막에 위치해야 중간에 return 되지 않고 무조건 화면에 뜹니다!
    // ==============================================================
    if (GEngine)
    {
        FString DataString = FString::Printf(TEXT("=== [AntiCheat Real-time Data] ===\n")
            TEXT("SpeedHack: %d | Aim: %d | GodMode: %d | ESP: %d\n")
            TEXT("Speed: %.1f | TargetDist: %.1f"),
            DataPacket.SpeedHack,
            DataPacket.Aim,
            DataPacket.GodMode,
            DataPacket.ESP,
            DataPacket.Speed,
            DataPacket.TargetDistance);

        GEngine->AddOnScreenDebugMessage(
            1,
            0.5f,
            bAnyHackActive ? FColor::Red : FColor::Cyan,
            DataString
        );
    }
}

bool UAntiCheatDataCollector::HasLyraDamageImmunity(const APawn* PawnOwner) const
{
    if (!IsValid(PawnOwner))
    {
        return true;
    }

    UAbilitySystemComponent* ASC =
        UAbilitySystemGlobals::GetAbilitySystemComponentFromActor(PawnOwner);

    if (!IsValid(ASC))
    {
        return true;
    }

    static const FGameplayTag DamageImmunityTag =
        FGameplayTag::RequestGameplayTag(FName("Gameplay.DamageImmunity"), false);

    if (!DamageImmunityTag.IsValid())
    {
        return false;
    }

    return ASC->HasMatchingGameplayTag(DamageImmunityTag);
}

bool UAntiCheatDataCollector::ShouldCollectTrainingLog(const APawn* PawnOwner)
{
    UWorld* World = GetWorld();
    if (!IsValid(World) || World->bIsTearingDown)
    {
        return false;
    }

    AGameStateBase* GameState = World->GetGameState<AGameStateBase>();
    if (!IsValid(GameState))
    {
        return false;
    }

    // 매치가 아직 시작되지 않았거나 이미 끝났으면 수집하지 않음
    if (!GameState->HasMatchStarted() || GameState->HasMatchEnded())
    {
        LogCollectionStartTime = -1.0f;
        return false;
    }

    // Lyra 대기시간 정상 무적 태그가 남아 있으면 수집하지 않음
    if (HasLyraDamageImmunity(PawnOwner))
    {
        LogCollectionStartTime = -1.0f;
        return false;
    }

    // 무적 태그가 사라진 직후 0.5~1초 정도만 안정화 대기
    if (LogCollectionStartTime < 0.0f)
    {
        LogCollectionStartTime = World->GetTimeSeconds() + PostImmunityGraceSeconds;
    }

    if (World->GetTimeSeconds() < LogCollectionStartTime)
    {
        return false;
    }

    return true;
}