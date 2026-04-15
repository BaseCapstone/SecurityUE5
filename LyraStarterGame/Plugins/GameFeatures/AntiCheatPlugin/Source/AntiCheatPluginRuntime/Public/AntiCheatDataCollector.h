#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "AntiCheatDataCollector.generated.h"

/**
 * 서버 전송용 안티치트 데이터 구조체
 */
USTRUCT(BlueprintType)
struct FAntiCheatDataPacket
{
	GENERATED_BODY()

	UPROPERTY() FString UserID;           // 유저 식별자
	UPROPERTY() float Timestamp;          // 수집 시각
	UPROPERTY() FVector Location;         // 위치 (X, Y, Z)
	UPROPERTY() float Speed;              // 이동 속도
	UPROPERTY() FRotator Rotation;        // 컨트롤 회전값 (에임)
	UPROPERTY() FRotator DeltaRotation;   // 에임 변화량
	UPROPERTY() float CurrentHP;          // 체력
	UPROPERTY() float TargetDistance;     // 가장 가까운 적과의 거리
	UPROPERTY() float TargetAngle;        // 적과의 각도
	UPROPERTY() bool bIsTargetVisible;    // 가시성 여부
};

/*
 * UAntiCheatDataCollector
 * 게임 내 부정행위(치팅) 탐지를 위해 플레이어의 데이터를 주기적으로 수집하는 컴포넌트
 */
UCLASS( ClassGroup=(AntiCheat), meta=(BlueprintSpawnableComponent) )
class ANTICHEATPLUGINRUNTIME_API UAntiCheatDataCollector : public UActorComponent
{
	GENERATED_BODY()

public:	
	// 생성자: 컴포넌트의 기본값들을 설정.
	UAntiCheatDataCollector();

protected:
	// 게임 시작 시 또는 컴포넌트 생성 시 1회 호출.
	// 데이터 수집을 위한 타이머를 시작
	virtual void BeginPlay() override;

private: 	
	// 데이터 수집 함수를 주기적으로 실행하기 위한 타이머 핸들
	FTimerHandle DataTimerHandle;

	// 이전 프레임의 컨트롤 회전값(에임 방향)을 저장
	// 현재 회전값과 비교하여 비정상적으로 빠른 회전(에임핵 등)을 감지하는 데 사용
	FRotator LastControlRotation;

	/**
	 * 실제 데이터를 수집하고 로그를 남기는 핵심 함수
	 * 타이머에 의해 호출되므로 UFUNCTION() 매크로가 필요
	 */
	UFUNCTION()
	void CollectAndlog();
};
