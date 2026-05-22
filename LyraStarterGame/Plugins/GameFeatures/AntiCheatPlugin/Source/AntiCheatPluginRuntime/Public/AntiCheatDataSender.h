#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "HttpFwd.h"
#include "AntiCheatDataCollector.h"
#include "AntiCheatDataSender.generated.h"

// 수집된 JSON 파일 배열을 AWS 서버로 전송하는 HTTP 통신 클래스
UCLASS()
class ANTICHEATPLUGINRUNTIME_API UAntiCheatDataSender : public UObject
{
	GENERATED_BODY()

public:
	// 리스트로 모인 데이터를 AWS 엔드 포인트로 전송
	void SendDataToAWS(const TArray<FAntiCheatDataPacket>& PacketList, const FString& EndpointURL, const FString& GameAuthToken);

private: 
	// HTTP 요청이 완료되었을 때 호출되는 콜백 함수
	void OnProcessRequestComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful);
	
};
