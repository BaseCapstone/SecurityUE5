#include "AntiCheatDataCollector.h"
#include "AntiCheatDataSender.h"
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
    // 매 프레임 연산은 성능 부하가 커서 (Tick 비활성화)타이머 방식을 활용
    PrimaryComponentTick.bCanEverTick = false;
    LastControlRotation = FRotator::ZeroRotator;
}

void UAntiCheatDataCollector::BeginPlay()
{
    Super::BeginPlay();

    // Sender 객체 생성
    DataSender = NewObject<UAntiCheatDataSender>(this);

    // 0.1초마다 데이터 수집
    GetWorld()->GetTimerManager().SetTimer(DataTimerHandle, this, &UAntiCheatDataCollector::CollectAndlog, 0.1f, true, 1.0f);
}

void UAntiCheatDataCollector::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    // 월드 파괴 전, 0.1초마다 도는 타이머를 완전히 정지
    if (UWorld* World = GetWorld())
    {
        World->GetTimerManager().ClearTimer(DataTimerHandle);
    }

    Super::EndPlay(EndPlayReason);
}

void UAntiCheatDataCollector::CollectAndlog()
{
    // 월드가 종료 중이면 아무것도 하지 않음
    if (!GetWorld() || GetWorld()->bIsTearingDown) return;

    AActor* Owner = GetOwner();
    if (!IsValid(Owner)) return;

    APlayerController* PC = Cast<APlayerController>(Owner);
    if (!PC) return;

    APawn* MyPawn = PC->GetPawn();
    if (!MyPawn || !MyPawn->IsValidLowLevel()) return;

    if (!PC->PlayerState) return;

    // 기본 물리 및 시간 데이터 수집
    FVector Loc = MyPawn->GetActorLocation();
    FRotator Rot = PC->GetControlRotation();
    float VelocitySize = MyPawn->GetVelocity().Size();
    float CurrentTime = GetWorld()->GetTimeSeconds();

    // 에임봇 탐지를 위한 회전 변화량 계산
    FRotator DeltaRot = Rot - LastControlRotation;
    DeltaRot.Normalize();
    LastControlRotation = Rot;

    // 체력 데이터 수집
    float CurrentHP = 0.0f;
    float MaxHP = 0.0f;

    // Lyra 프레임 워크의 체력 컴포넌트를 참조하여 데이터 추출
    ULyraHealthComponent* HealthComp = MyPawn->FindComponentByClass<ULyraHealthComponent>();
    if (HealthComp)
    {
        CurrentHP = HealthComp->GetHealth();
        MaxHP = HealthComp->GetMaxHealth();
    }

    // 가장 가까운 타겟 탐색
    float ClosestEnemyDist = 999999.0f;
    AActor* ClosestEnemy = nullptr;

    TArray<AActor*> FoundEnemies;
    // 월드 내의 모든 APawn을 추출
    UGameplayStatics::GetAllActorsOfClass(GetWorld(), APawn::StaticClass(), FoundEnemies);

    // 내 위치를 기준으로 가장 거리가 짧은 적을 탐색
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

    // 타켓 방향 각도 및 시야(ESP) 판별 로직
    float AngleToEnemy = 0.0f;
    bool bIsEnemyVisible = false;

    if (ClosestEnemy)
    {
        FVector CamLocation;
        FRotator CamRotation;
        PC->GetPlayerViewPoint(CamLocation, CamRotation); // 실제 플레이어의 카메라 기준 위치/회전

        FVector EnemyLocation = ClosestEnemy->GetActorLocation();

        // 화면 중앙과 적의 각도 차이 계산(내적)
        FVector DirToEnemy = (EnemyLocation - CamLocation).GetSafeNormal();
        FVector CamForward = CamRotation.Vector();
        float DotProduct = FVector::DotProduct(CamForward, DirToEnemy);
        AngleToEnemy = FMath::RadiansToDegrees(FMath::Acos(DotProduct));

        // 장애물 너머 가시성 판별
        FHitResult HitResult;
        FCollisionQueryParams CollisionParams;
        CollisionParams.AddIgnoredActor(MyPawn); // 레이캐스트가 내 캐릭터 몸에 막히지 않도록 예외 처리
        
        // 카메라에서 적 위치까지 시야선을 발사
        bool bHit = GetWorld()->LineTraceSingleByChannel(
            HitResult,
            CamLocation,
            EnemyLocation,
            ECC_Visibility,
            CollisionParams
        );
        
        // 아무것도 안 맞았거나(장애물 없음), 맞은 물체가 타겟 본인이라면 시야에 보이는 상태
        if (!bHit || HitResult.GetActor() == ClosestEnemy)
        {
            bIsEnemyVisible = true;
        }
    }

    // 데이터 패킷 조립
    FAntiCheatDataPacket DataPacket;

    // 계정 연동 전까지는 OS 계정명 또는 기본값 사용
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

    // 완성된 패킷을 배열 버퍼에 추가
    PacketBuffer.Add(DataPacket);

    // 버퍼에 데이터가 MaxBufferSize(30개 = 3초 분량)만큼 쌓였다면 서버로 일괄 전송
    if (PacketBuffer.Num() >= MaxBufferSize)
    {
        if (DataSender)
        {
            // 리스트를 AWS로 전송
            DataSender->SendDataToAWS(PacketBuffer, AWSEndpointURL);
        }
        // 전송이 끝나면 배열을 비워 다시 수집할 준비
        PacketBuffer.Empty();
    }


    // ------------------------------------------
    // 개발자 디버깅용 화면 출력
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

        // 화면 갱신 주기에 맞춰 0.11초 동안 화면에 표시
        GEngine->AddOnScreenDebugMessage(2, 0.11f, FColor::Cyan, DataString);
    }
}