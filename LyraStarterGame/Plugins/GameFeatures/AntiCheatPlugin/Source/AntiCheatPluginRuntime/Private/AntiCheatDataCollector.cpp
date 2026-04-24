#include "AntiCheatDataCollector.h"
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

UAntiCheatDataCollector::UAntiCheatDataCollector()
{
    PrimaryComponentTick.bCanEverTick = false;
    LastControlRotation = FRotator::ZeroRotator;
}

void UAntiCheatDataCollector::BeginPlay()
{
    Super::BeginPlay();
    // 0.1초마다 데이터 수집
    GetWorld()->GetTimerManager().SetTimer(DataTimerHandle, this, &UAntiCheatDataCollector::CollectAndlog, 0.1f, true, 1.0f);
}

void UAntiCheatDataCollector::CollectAndlog()
{
    AActor* Owner = GetOwner();
    if (!Owner) return;

    APlayerController* PC = Cast<APlayerController>(Owner);
    if (!PC) return;

    APawn* MyPawn = PC->GetPawn();
    if (!MyPawn || !MyPawn->IsValidLowLevel()) return;

    if (!PC->PlayerState) return;

    FVector Loc = MyPawn->GetActorLocation();
    FRotator Rot = PC->GetControlRotation();
    float VelocitySize = MyPawn->GetVelocity().Size();
    float CurrentTime = GetWorld()->GetTimeSeconds();

    FRotator DeltaRot = Rot - LastControlRotation;
    DeltaRot.Normalize();
    LastControlRotation = Rot;

    float CurrentHP = 0.0f;
    float MaxHP = 0.0f;

    ULyraHealthComponent* HealthComp = MyPawn->FindComponentByClass<ULyraHealthComponent>();
    if (HealthComp)
    {
        CurrentHP = HealthComp->GetHealth();
        MaxHP = HealthComp->GetMaxHealth();
    }

    float ClosestEnemyDist = 999999.0f;
    AActor* ClosestEnemy = nullptr;

    TArray<AActor*> FoundEnemies;
    UGameplayStatics::GetAllActorsOfClass(GetWorld(), APawn::StaticClass(), FoundEnemies);

    for (AActor* Enemy : FoundEnemies)
    {
        if (Enemy == MyPawn) continue;

        float Dist = FVector::Dist(Loc, Enemy->GetActorLocation());
        if (Dist < ClosestEnemyDist)
        {
            ClosestEnemyDist = Dist;
            ClosestEnemy = Enemy;
        }
    }

    float AngleToEnemy = 0.0f;
    bool bIsEnemyVisible = false;

    if (ClosestEnemy)
    {
        FVector CamLocation;
        FRotator CamRotation;
        PC->GetPlayerViewPoint(CamLocation, CamRotation);

        FVector EnemyLocation = ClosestEnemy->GetActorLocation();

        FVector DirToEnemy = (EnemyLocation - CamLocation).GetSafeNormal();
        FVector CamForward = CamRotation.Vector();
        float DotProduct = FVector::DotProduct(CamForward, DirToEnemy);
        AngleToEnemy = FMath::RadiansToDegrees(FMath::Acos(DotProduct));

        FHitResult HitResult;
        FCollisionQueryParams CollisionParams;
        CollisionParams.AddIgnoredActor(MyPawn);

        bool bHit = GetWorld()->LineTraceSingleByChannel(
            HitResult,
            CamLocation,
            EnemyLocation,
            ECC_Visibility,
            CollisionParams
        );

        if (!bHit || HitResult.GetActor() == ClosestEnemy)
        {
            bIsEnemyVisible = true;
        }
    }

    FAntiCheatDataPacket DataPacket;

    // 플레이어 닉네임: 아직 계정 연동이 안 되어 User 데스크탑으로 연동
    if (PC->PlayerState)
    {
        DataPacket.UserID = PC->PlayerState->GetPlayerName();
    }
    else
    {
        DataPacket.UserID = TEXT("Guest_User");
    }

    DataPacket.Timestamp = CurrentTime;             // 게임 월드 시간
    DataPacket.Location = Loc;                      // 3차원 좌표
    DataPacket.Speed = VelocitySize;                // 이동 속도
    DataPacket.Rotation = Rot;                      // 마우스 시야 회전값
    DataPacket.DeltaRotation = DeltaRot;            // 이전 틱과 비교한 마우스 회전값 변화량
    DataPacket.CurrentHP = CurrentHP;               // 현재 체력
    DataPacket.TargetDistance = ClosestEnemyDist;   // 가장 가까운 적과의 거리
    DataPacket.TargetAngle = AngleToEnemy;          // 카메라 방향 기준, 가장 가까운 적이 몇 도 단위로 떨어져 있는지 변화량
    DataPacket.bIsTargetVisible = bIsEnemyVisible;  // 가장 가까운 적이 벽 뒤에 가려지지 않고 내 화면상에 물리적으로 보이는 상태인지 여부

    FString JsonString;
    if (FJsonObjectConverter::UStructToJsonObjectString(DataPacket, JsonString))
    {
        UE_LOG(LogTemp, Warning, TEXT("Generated JSON Payload: %s"), *JsonString);
    }
    // ------------------------------------------

    if (GEngine)
    {
        FString DataString = FString::Printf(TEXT("=== [AntiCheat Real-time Data] ===\n")
            TEXT("Time: %.2f | Speed: %.1f\n")
            TEXT("Loc: X:%.f Y:%.f Z:%.f\n")
            TEXT("Aim: P:%.1f Y:%.1f\n")
            TEXT("DeltaAim: P:%.2f Y:%.2f\n")
            TEXT("HP: %.f / %.f (Status: %s)\n")
            TEXT("Target Dist: %.f\n")
            TEXT("Target Angle: %.1f deg\n")
            TEXT("Target Visible: %s"),
            CurrentTime, VelocitySize,
            Loc.X, Loc.Y, Loc.Z,
            Rot.Pitch, Rot.Yaw,
            DeltaRot.Pitch, DeltaRot.Yaw,
            CurrentHP, MaxHP, (CurrentHP > MaxHP ? TEXT("DANGER") : TEXT("NORMAL")),
            ClosestEnemyDist,
            AngleToEnemy,
            bIsEnemyVisible ? TEXT("TRUE") : TEXT("FALSE"));

        GEngine->AddOnScreenDebugMessage(2, 0.11f, FColor::Cyan, DataString);
    }
}