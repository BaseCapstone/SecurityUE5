#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "AntiCheatDataCollector.generated.h"
USTRUCT(BlueprintType)

// 플레이어 데이터 패킷 구조체
struct FAntiCheatDataPacket
{
	GENERATED_BODY()

	// 플레이어 고유 식별자
	UPROPERTY() FString UserID; 

	// 데이터 수집 시간
	UPROPERTY() float Timestamp;

	// 현재 플레이어의 월드 좌표
	UPROPERTY() FVector Location;         
	
	// 현재 이동 속도
	UPROPERTY() float Speed;              
	
	// 현재 시선 및 캐릭터 회전값
	UPROPERTY() FRotator Rotation;        
	
	// 이전 수집 주기 대비 회전 변화량(에임봇 특유의 인간의 한계를 벗어난 순간적인 화면 전환)
	UPROPERTY() FRotator DeltaRotation;   
	
	// 현재 체력
	UPROPERTY() float CurrentHP;          
	
	// 조준 중인 타켓과의 거리
	UPROPERTY() float TargetDistance;     
	
	// 플레이어의 시선 정면과 타겟 간의 각도 차이(정상적인 시야 밖의 적을 정확히 조준하고 있는지 탐지)
	UPROPERTY() float TargetAngle;        
	
	// 타겟이 벽 등 장애물에 가려지지 않고 시야에 보이는지 여부(벽 뒤의 적을 추척)
	UPROPERTY() bool bIsTargetVisible;    
};

// 플레이어 캐릭터 또는 컨트롤러에 부착되어 안티치트 데이터를 주기적으로 수집하는 컴포넌트
UCLASS( ClassGroup=(AntiCheat), meta=(BlueprintSpawnableComponent) )
class ANTICHEATPLUGINRUNTIME_API UAntiCheatDataCollector : public UActorComponent
{
	GENERATED_BODY()

public:	
	// 기본 생성자: 컴포넌트 초기화 및 틱 활성화 여부 등 설정
	UAntiCheatDataCollector();

protected:
	// 게임 시작 시 호출되며, 데이터 수집을 위한 타이머를 초기화하고 실행
	virtual void BeginPlay() override;
	
	// 타이머 정지를 위한 EndPlay 오버라이드
	virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;
private: 
	// 주기적인 데이터 수집을 제어하는 타이머 핸들
	FTimerHandle DataTimerHandle;

	// 에임봇 탐지를 위해 이전 수집 시점의 회전값을 임시로 저장하는 변수
	FRotator LastControlRotation;

	// 현재 플레이어의 상태를 FAntiCheatDataPacket에 담아 로그로 기록하거나 서버로 전송
	UFUNCTION()
	void CollectAndlog();

	// HTTP 통신을 담당할 Sender 객체
	UPROPERTY()
	TObjectPtr<class UAntiCheatDataSender> DataSender;

	// AWS로 보내기 전 데이터를 임시로 쌓아둘 배열 (버퍼)
	TArray<FAntiCheatDataPacket> PacketBuffer;

	// 몇 개가 쌓이면 보낼 것인지 (현재: 0.1초 x 30개 = 3초 단위로 전송)
	const int32 MaxBufferSize = 30;

	// AWS API Gateway 또는 EC2 서버 URL 주소 입력
	FString AWSEndpointURL = TEXT("https://perfectly-curdle-gecko.ngrok-free.dev/log");
};
