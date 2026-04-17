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
				"GameplayAbilities",
				"GameplayTags",
				"InputCore",
				"LyraGame",
				"ModularGameplay",
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
