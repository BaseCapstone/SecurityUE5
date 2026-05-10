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

UAntiCheatDataCollector::UAntiCheatDataCollector()
{
    PrimaryComponentTick.bCanEverTick = false;
    LastControlRotation = FRotator::ZeroRotator;
}

void UAntiCheatDataCollector::BeginPlay()
{
    Super::BeginPlay();

    DataSender = NewObject<UAntiCheatDataSender>(this);

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
    if (!PC) return; // 아직 조종 전이거나 봇이면 여기서 멈춤 (로그 안 뜸)

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
    FAntiCheatDataPacket DataPacket;
    DataPacket.UserID = PC->PlayerState ? PC->PlayerState->GetPlayerName() : TEXT("UnknownPlayer");
    DataPacket.Timestamp = GetWorld()->GetTimeSeconds();
    DataPacket.Location = Owner->GetActorLocation();
    DataPacket.Speed = Owner->GetVelocity().Size();

    FRotator CurrentRotation = PC->GetControlRotation();
    DataPacket.Rotation = CurrentRotation;
    DataPacket.DeltaRotation = CurrentRotation - LastControlRotation;
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
    if (PacketBuffer.Num() >= 30) // MaxBufferSize(30)
    {
        if (DataSender)
        {
            DataSender->SendDataToAWS(PacketBuffer, AWSEndpointURL); // AWSEndpointURL 변수가 헤더에 있어야 함
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