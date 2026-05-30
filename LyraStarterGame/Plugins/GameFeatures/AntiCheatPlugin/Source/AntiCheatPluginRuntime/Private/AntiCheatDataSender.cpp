#include "AntiCheatDataSender.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "JsonObjectConverter.h"
#include "Serialization/JsonSerializer.h" 

void UAntiCheatDataSender::SendDataToAWS(const TArray<FAntiCheatDataPacket>& PacketList, const FString& EndpointURL, const FString& GameAuthToken)
{
	if (PacketList.IsEmpty()) return;

	// TArray 배열을 순회하며 JSON 배열 형태로 변환
	TArray<TSharedPtr<FJsonValue>> JsonArray;

	for (const FAntiCheatDataPacket& Packet : PacketList)
	{
		TSharedRef<FJsonObject> JsonObj = MakeShared<FJsonObject>();

		// 구조체 하나를 Json Object로 변환
		if (FJsonObjectConverter::UStructToJsonObject(FAntiCheatDataPacket::StaticStruct(), &Packet, JsonObj, 0, 0))
		{
			JsonArray.Add(MakeShared<FJsonValueObject>(JsonObj));
		}
	}

	// 만들어진 JSON 배열을 FString(문자열)으로 직렬화
	FString JsonString;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
	if (!FJsonSerializer::Serialize(JsonArray, Writer))
	{
		UE_LOG(LogTemp, Error, TEXT("Failed to serialize JsonArray to String."));
		return;
	}
	// 직렬화된 JSON 문자열을 언리얼 로그에 출력
	UE_LOG(LogTemp, Warning, TEXT("--- Attempting to send data to AWS ---"));
	UE_LOG(LogTemp, Log, TEXT("JSON Payload: %s"), *JsonString);

	// HTTP POST 요청 생성
	TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();

	// 통신 완료 시 실행될 콜백 바인딩
	Request->OnProcessRequestComplete().BindUObject(this, &UAntiCheatDataSender::OnProcessRequestComplete);

	// URL 및 헤더 설정
	Request->SetURL(EndpointURL);
	Request->SetVerb("POST");
	Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
	if (!GameAuthToken.IsEmpty())
	{
		Request->SetHeader(TEXT("Authorization"), FString::Printf(TEXT("Bearer %s"), *GameAuthToken));
		UE_LOG(LogTemp, Log, TEXT("[AntiCheat] Authorization header set for log upload."));
	}
	else
	{
		UE_LOG(LogTemp, Error, TEXT("[AntiCheat] GameAuthToken is empty. Log upload will be unauthorized."));
	}

	// 변환된 JSON 리스트 데이터를 바디에 적재
	Request->SetContentAsString(JsonString);

	// 전송 시작
	Request->ProcessRequest();
}

void UAntiCheatDataSender::OnProcessRequestComplete(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
{
	if (bWasSuccessful && Response.IsValid())
	{
		if (EHttpResponseCodes::IsOk(Response->GetResponseCode()))
		{
			UE_LOG(LogTemp, Log, TEXT("AWS Send Success! Response: %s"), *Response->GetContentAsString());
		}
		else
		{
			UE_LOG(LogTemp, Error, TEXT("AWS Error! Code: %d, Message: %s"), Response->GetResponseCode(), *Response->GetContentAsString());
		}
	}
	else
	{
		UE_LOG(LogTemp, Error, TEXT("AWS Request Failed. Please check internet connection or URL."));
	}
}