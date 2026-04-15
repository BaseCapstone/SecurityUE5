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

    // --- 데이터 구조체 패키징 및 JSON 변환 추가 ---
    FAntiCheatDataPacket DataPacket;

    if (PC->PlayerState)
    {
        // DataPacket.UserID = PC->PlayerState->GetUniqueId().ToString();
        DataPacket.UserID = PC->PlayerState->GetPlayerName();
    }
    else
    {
        DataPacket.UserID = TEXT("Guest_User");
    }

    DataPacket.Timestamp = CurrentTime;
    DataPacket.Location = Loc;
    DataPacket.Speed = VelocitySize;
    DataPacket.Rotation = Rot;
    DataPacket.DeltaRotation = DeltaRot;
    DataPacket.CurrentHP = CurrentHP;
    DataPacket.TargetDistance = ClosestEnemyDist;
    DataPacket.TargetAngle = AngleToEnemy;
    DataPacket.bIsTargetVisible = bIsEnemyVisible;

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