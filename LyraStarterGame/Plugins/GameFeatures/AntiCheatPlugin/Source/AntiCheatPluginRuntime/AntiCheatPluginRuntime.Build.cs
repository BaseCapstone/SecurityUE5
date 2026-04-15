// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;

public class AntiCheatPluginRuntime : ModuleRules
{
	public AntiCheatPluginRuntime(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = ModuleRules.PCHUsageMode.UseExplicitOrSharedPCHs;
		
		PublicIncludePaths.AddRange(
			new string[] {
				// ... add public include paths required here ...
			}
			);
				
		
		PrivateIncludePaths.AddRange(
			new string[] {
				// ... add other private include paths required here ...
			}
			);
			
		
		PublicDependencyModuleNames.AddRange(
			new string[]
			{
				"Core",
				"LyraGame",      // Lyra 코어 접근
        		"ModularGameplay", // Game Feature 컴포넌트 주입용
        		"HTTP",          // 서버와 통신하기 위해 필수
        		"Json",          // JSON 데이터를 다루기 위해 필수
        		"JsonUtilities",  // C++ 구조체를 JSON으로 쉽게 변환하기 위해 필수
				"OnlineSubsystem",
				"ModularGameplay"
			}
			);
			
		
		PrivateDependencyModuleNames.AddRange(
			new string[]
			{
				"CoreUObject",
				"Engine",
				"Slate",
				"SlateCore",
				// ... add private dependencies that you statically link with here ...	
			}
			);
		
		
		DynamicallyLoadedModuleNames.AddRange(
			new string[]
			{
				// ... add any modules that your module loads dynamically here ...
			}
			);
	}
}
