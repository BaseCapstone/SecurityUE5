// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;

public class AntiCheatPluginRuntime : ModuleRules
{
	public AntiCheatPluginRuntime(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = ModuleRules.PCHUsageMode.UseExplicitOrSharedPCHs;
<<<<<<< HEAD
		
=======

>>>>>>> feature/data-extraction
		PublicDependencyModuleNames.AddRange(
			new string[]
			{
				"Core",
				"CoreUObject",
				"Engine",
<<<<<<< HEAD
				"GameplayAbilities",
				"GameplayTags",
				"InputCore",
				"LyraGame",
				"ModularGameplay",
=======
				"GameplayAbilites",
				"GameplayTags",
				"InputCore",
				"LyraGame",     
				"ModularGameplay",
        		"HTTP",          
        		"Json",          
        		"JsonUtilities", 
				"OnlineSubsystem",
>>>>>>> feature/data-extraction
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
