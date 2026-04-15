// Copyright Epic Games, Inc. All Rights Reserved.

#include "LyraGameViewportClient.h"

#include "CommonUISettings.h"
#include "ICommonUIModule.h"
#include "Misc/CoreDelegates.h"

#include UE_INLINE_GENERATED_CPP_BY_NAME(LyraGameViewportClient)

class UGameInstance;

namespace GameViewportTags
{
	UE_DEFINE_GAMEPLAY_TAG_STATIC(TAG_Platform_Trait_Input_HardwareCursor, "Platform.Trait.Input.HardwareCursor");
}

ULyraGameViewportClient::ULyraGameViewportClient()
	: Super(FObjectInitializer::Get())
{
}

void ULyraGameViewportClient::Init(struct FWorldContext& WorldContext, UGameInstance* OwningGameInstance, bool bCreateNewAudioDevice)
{
	Super::Init(WorldContext, OwningGameInstance, bCreateNewAudioDevice);
	
	// We have software cursors set up in our project settings for console/mobile use, but on desktop we're fine with
	// the standard hardware cursors
	const bool UseHardwareCursor = ICommonUIModule::GetSettings().GetPlatformTraits().HasTag(GameViewportTags::TAG_Platform_Trait_Input_HardwareCursor);
	SetUseSoftwareCursorWidgets(!UseHardwareCursor);
}

bool ULyraGameViewportClient::WindowCloseRequested()
{
	RequestEngineExit(TEXT("Game viewport window closed"));
	return Super::WindowCloseRequested();
}

void ULyraGameViewportClient::CloseRequested(FViewport* InViewport)
{
	Super::CloseRequested(InViewport);
	RequestEngineExit(TEXT("Game viewport close requested"));
}
