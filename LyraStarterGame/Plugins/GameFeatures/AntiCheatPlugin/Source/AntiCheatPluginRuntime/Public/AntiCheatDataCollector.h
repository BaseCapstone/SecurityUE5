#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "AntiCheatDataCollector.generated.h"
USTRUCT(BlueprintType)
struct FAntiCheatDataPacket
{
	GENERATED_BODY()

	UPROPERTY() FString UserID;           
	UPROPERTY() float Timestamp;          
	UPROPERTY() FVector Location;         
	UPROPERTY() float Speed;              
	UPROPERTY() FRotator Rotation;        
	UPROPERTY() FRotator DeltaRotation;   
	UPROPERTY() float CurrentHP;          
	UPROPERTY() float TargetDistance;     
	UPROPERTY() float TargetAngle;        
	UPROPERTY() bool bIsTargetVisible;    
};

UCLASS( ClassGroup=(AntiCheat), meta=(BlueprintSpawnableComponent) )
class ANTICHEATPLUGINRUNTIME_API UAntiCheatDataCollector : public UActorComponent
{
	GENERATED_BODY()

public:	
	
	UAntiCheatDataCollector();

protected:
	
	virtual void BeginPlay() override;

private: 	
	FTimerHandle DataTimerHandle;

	FRotator LastControlRotation;

	UFUNCTION()
	void CollectAndlog();
};
