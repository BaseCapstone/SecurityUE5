// Copyright Epic Games, Inc. All Rights Reserved.
/*===========================================================================
	Generated code exported from UnrealHeaderTool.
	DO NOT modify this manually! Edit the corresponding .h files instead!
===========================================================================*/

// IWYU pragma: private, include "AntiCheatDataCollector.h"

#ifdef ANTICHEATPLUGINRUNTIME_AntiCheatDataCollector_generated_h
#error "AntiCheatDataCollector.generated.h already included, missing '#pragma once' in AntiCheatDataCollector.h"
#endif
#define ANTICHEATPLUGINRUNTIME_AntiCheatDataCollector_generated_h

#include "UObject/ObjectMacros.h"
#include "UObject/ScriptMacros.h"

PRAGMA_DISABLE_DEPRECATION_WARNINGS

// ********** Begin ScriptStruct FAntiCheatDataPacket **********************************************
#define FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h_13_GENERATED_BODY \
	friend struct Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics; \
	ANTICHEATPLUGINRUNTIME_API static class UScriptStruct* StaticStruct();


struct FAntiCheatDataPacket;
// ********** End ScriptStruct FAntiCheatDataPacket ************************************************

// ********** Begin Class UAntiCheatDataCollector **************************************************
#define FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h_34_RPC_WRAPPERS_NO_PURE_DECLS \
	DECLARE_FUNCTION(execCollectAndlog);


ANTICHEATPLUGINRUNTIME_API UClass* Z_Construct_UClass_UAntiCheatDataCollector_NoRegister();

#define FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h_34_INCLASS_NO_PURE_DECLS \
private: \
	static void StaticRegisterNativesUAntiCheatDataCollector(); \
	friend struct Z_Construct_UClass_UAntiCheatDataCollector_Statics; \
	static UClass* GetPrivateStaticClass(); \
	friend ANTICHEATPLUGINRUNTIME_API UClass* Z_Construct_UClass_UAntiCheatDataCollector_NoRegister(); \
public: \
	DECLARE_CLASS2(UAntiCheatDataCollector, UActorComponent, COMPILED_IN_FLAGS(0 | CLASS_Config), CASTCLASS_None, TEXT("/Script/AntiCheatPluginRuntime"), Z_Construct_UClass_UAntiCheatDataCollector_NoRegister) \
	DECLARE_SERIALIZER(UAntiCheatDataCollector)


#define FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h_34_ENHANCED_CONSTRUCTORS \
	/** Deleted move- and copy-constructors, should never be used */ \
	UAntiCheatDataCollector(UAntiCheatDataCollector&&) = delete; \
	UAntiCheatDataCollector(const UAntiCheatDataCollector&) = delete; \
	DECLARE_VTABLE_PTR_HELPER_CTOR(NO_API, UAntiCheatDataCollector); \
	DEFINE_VTABLE_PTR_HELPER_CTOR_CALLER(UAntiCheatDataCollector); \
	DEFINE_DEFAULT_CONSTRUCTOR_CALL(UAntiCheatDataCollector) \
	NO_API virtual ~UAntiCheatDataCollector();


#define FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h_31_PROLOG
#define FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h_34_GENERATED_BODY \
PRAGMA_DISABLE_DEPRECATION_WARNINGS \
public: \
	FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h_34_RPC_WRAPPERS_NO_PURE_DECLS \
	FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h_34_INCLASS_NO_PURE_DECLS \
	FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h_34_ENHANCED_CONSTRUCTORS \
private: \
PRAGMA_ENABLE_DEPRECATION_WARNINGS


class UAntiCheatDataCollector;

// ********** End Class UAntiCheatDataCollector ****************************************************

#undef CURRENT_FILE_ID
#define CURRENT_FILE_ID FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h

PRAGMA_ENABLE_DEPRECATION_WARNINGS
