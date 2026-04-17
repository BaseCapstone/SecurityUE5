// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;

public class AntiCheatPluginRuntime : ModuleRules
{
	public AntiCheatPluginRuntime(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = ModuleRules.PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(
			new string[]
			{
				"Core",
				"CoreUObject",
				"Engine",
				"GameplayAbilites",
				"GameplayTags",
				"InputCore",
				"LyraGame",     
				"ModularGameplay",
        		"HTTP",          
        		"Json",          
        		"JsonUtilities", 
				"OnlineSubsystem",
			}
		);
			
		
		PrivateDependencyModuleNames.AddRange(
			new string[]
			{
				"Slate",
				"SlateCore",
			}
		);
	}
}
