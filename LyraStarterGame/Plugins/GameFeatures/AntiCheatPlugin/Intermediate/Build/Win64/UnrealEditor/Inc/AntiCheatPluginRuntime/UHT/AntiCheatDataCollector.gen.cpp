// Copyright Epic Games, Inc. All Rights Reserved.
/*===========================================================================
	Generated code exported from UnrealHeaderTool.
	DO NOT modify this manually! Edit the corresponding .h files instead!
===========================================================================*/

#include "UObject/GeneratedCppIncludes.h"
#include "AntiCheatDataCollector.h"

PRAGMA_DISABLE_DEPRECATION_WARNINGS

void EmptyLinkFunctionForGeneratedCodeAntiCheatDataCollector() {}

// ********** Begin Cross Module References ********************************************************
ANTICHEATPLUGINRUNTIME_API UClass* Z_Construct_UClass_UAntiCheatDataCollector();
ANTICHEATPLUGINRUNTIME_API UClass* Z_Construct_UClass_UAntiCheatDataCollector_NoRegister();
ANTICHEATPLUGINRUNTIME_API UScriptStruct* Z_Construct_UScriptStruct_FAntiCheatDataPacket();
COREUOBJECT_API UScriptStruct* Z_Construct_UScriptStruct_FRotator();
COREUOBJECT_API UScriptStruct* Z_Construct_UScriptStruct_FVector();
ENGINE_API UClass* Z_Construct_UClass_UActorComponent();
UPackage* Z_Construct_UPackage__Script_AntiCheatPluginRuntime();
// ********** End Cross Module References **********************************************************

// ********** Begin ScriptStruct FAntiCheatDataPacket **********************************************
static FStructRegistrationInfo Z_Registration_Info_UScriptStruct_FAntiCheatDataPacket;
class UScriptStruct* FAntiCheatDataPacket::StaticStruct()
{
	if (!Z_Registration_Info_UScriptStruct_FAntiCheatDataPacket.OuterSingleton)
	{
		Z_Registration_Info_UScriptStruct_FAntiCheatDataPacket.OuterSingleton = GetStaticStruct(Z_Construct_UScriptStruct_FAntiCheatDataPacket, (UObject*)Z_Construct_UPackage__Script_AntiCheatPluginRuntime(), TEXT("AntiCheatDataPacket"));
	}
	return Z_Registration_Info_UScriptStruct_FAntiCheatDataPacket.OuterSingleton;
}
struct Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics
{
#if WITH_METADATA
	static constexpr UECodeGen_Private::FMetaDataPairParam Struct_MetaDataParams[] = {
		{ "BlueprintType", "true" },
#if !UE_BUILD_SHIPPING
		{ "Comment", "/**\n * \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xdb\xbf\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xc6\xbc\xc4\xa1\xc6\xae \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xc3\xbc\n */" },
#endif
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
#if !UE_BUILD_SHIPPING
		{ "ToolTip", "\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xdb\xbf\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xc6\xbc\xc4\xa1\xc6\xae \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xc3\xbc" },
#endif
	};
	static constexpr UECodeGen_Private::FMetaDataPairParam NewProp_UserID_MetaData[] = {
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
	};
	static constexpr UECodeGen_Private::FMetaDataPairParam NewProp_Timestamp_MetaData[] = {
#if !UE_BUILD_SHIPPING
		{ "Comment", "// \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xc4\xba\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\n" },
#endif
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
#if !UE_BUILD_SHIPPING
		{ "ToolTip", "\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xc4\xba\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd" },
#endif
	};
	static constexpr UECodeGen_Private::FMetaDataPairParam NewProp_Location_MetaData[] = {
#if !UE_BUILD_SHIPPING
		{ "Comment", "// \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xc3\xb0\xef\xbf\xbd\n" },
#endif
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
#if !UE_BUILD_SHIPPING
		{ "ToolTip", "\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xc3\xb0\xef\xbf\xbd" },
#endif
	};
	static constexpr UECodeGen_Private::FMetaDataPairParam NewProp_Speed_MetaData[] = {
#if !UE_BUILD_SHIPPING
		{ "Comment", "// \xef\xbf\xbd\xef\xbf\xbd\xc4\xa1 (X, Y, Z)\n" },
#endif
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
#if !UE_BUILD_SHIPPING
		{ "ToolTip", "\xef\xbf\xbd\xef\xbf\xbd\xc4\xa1 (X, Y, Z)" },
#endif
	};
	static constexpr UECodeGen_Private::FMetaDataPairParam NewProp_Rotation_MetaData[] = {
#if !UE_BUILD_SHIPPING
		{ "Comment", "// \xef\xbf\xbd\xcc\xb5\xef\xbf\xbd \xef\xbf\xbd\xd3\xb5\xef\xbf\xbd\n" },
#endif
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
#if !UE_BUILD_SHIPPING
		{ "ToolTip", "\xef\xbf\xbd\xcc\xb5\xef\xbf\xbd \xef\xbf\xbd\xd3\xb5\xef\xbf\xbd" },
#endif
	};
	static constexpr UECodeGen_Private::FMetaDataPairParam NewProp_DeltaRotation_MetaData[] = {
#if !UE_BUILD_SHIPPING
		{ "Comment", "// \xef\xbf\xbd\xef\xbf\xbd\xc6\xae\xef\xbf\xbd\xef\xbf\xbd \xc8\xb8\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd (\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd)\n" },
#endif
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
#if !UE_BUILD_SHIPPING
		{ "ToolTip", "\xef\xbf\xbd\xef\xbf\xbd\xc6\xae\xef\xbf\xbd\xef\xbf\xbd \xc8\xb8\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd (\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd)" },
#endif
	};
	static constexpr UECodeGen_Private::FMetaDataPairParam NewProp_CurrentHP_MetaData[] = {
#if !UE_BUILD_SHIPPING
		{ "Comment", "// \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xc8\xad\xef\xbf\xbd\xef\xbf\xbd\n" },
#endif
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
#if !UE_BUILD_SHIPPING
		{ "ToolTip", "\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xc8\xad\xef\xbf\xbd\xef\xbf\xbd" },
#endif
	};
	static constexpr UECodeGen_Private::FMetaDataPairParam NewProp_TargetDistance_MetaData[] = {
#if !UE_BUILD_SHIPPING
		{ "Comment", "// \xc3\xbc\xef\xbf\xbd\xef\xbf\xbd\n" },
#endif
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
#if !UE_BUILD_SHIPPING
		{ "ToolTip", "\xc3\xbc\xef\xbf\xbd\xef\xbf\xbd" },
#endif
	};
	static constexpr UECodeGen_Private::FMetaDataPairParam NewProp_TargetAngle_MetaData[] = {
#if !UE_BUILD_SHIPPING
		{ "Comment", "// \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xc5\xb8\xef\xbf\xbd\n" },
#endif
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
#if !UE_BUILD_SHIPPING
		{ "ToolTip", "\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xc5\xb8\xef\xbf\xbd" },
#endif
	};
	static constexpr UECodeGen_Private::FMetaDataPairParam NewProp_bIsTargetVisible_MetaData[] = {
#if !UE_BUILD_SHIPPING
		{ "Comment", "// \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\n" },
#endif
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
#if !UE_BUILD_SHIPPING
		{ "ToolTip", "\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd" },
#endif
	};
#endif // WITH_METADATA
	static const UECodeGen_Private::FStrPropertyParams NewProp_UserID;
	static const UECodeGen_Private::FFloatPropertyParams NewProp_Timestamp;
	static const UECodeGen_Private::FStructPropertyParams NewProp_Location;
	static const UECodeGen_Private::FFloatPropertyParams NewProp_Speed;
	static const UECodeGen_Private::FStructPropertyParams NewProp_Rotation;
	static const UECodeGen_Private::FStructPropertyParams NewProp_DeltaRotation;
	static const UECodeGen_Private::FFloatPropertyParams NewProp_CurrentHP;
	static const UECodeGen_Private::FFloatPropertyParams NewProp_TargetDistance;
	static const UECodeGen_Private::FFloatPropertyParams NewProp_TargetAngle;
	static void NewProp_bIsTargetVisible_SetBit(void* Obj);
	static const UECodeGen_Private::FBoolPropertyParams NewProp_bIsTargetVisible;
	static const UECodeGen_Private::FPropertyParamsBase* const PropPointers[];
	static void* NewStructOps()
	{
		return (UScriptStruct::ICppStructOps*)new UScriptStruct::TCppStructOps<FAntiCheatDataPacket>();
	}
	static const UECodeGen_Private::FStructParams StructParams;
};
const UECodeGen_Private::FStrPropertyParams Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_UserID = { "UserID", nullptr, (EPropertyFlags)0x0010000000000000, UECodeGen_Private::EPropertyGenFlags::Str, RF_Public|RF_Transient|RF_MarkAsNative, nullptr, nullptr, 1, STRUCT_OFFSET(FAntiCheatDataPacket, UserID), METADATA_PARAMS(UE_ARRAY_COUNT(NewProp_UserID_MetaData), NewProp_UserID_MetaData) };
const UECodeGen_Private::FFloatPropertyParams Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_Timestamp = { "Timestamp", nullptr, (EPropertyFlags)0x0010000000000000, UECodeGen_Private::EPropertyGenFlags::Float, RF_Public|RF_Transient|RF_MarkAsNative, nullptr, nullptr, 1, STRUCT_OFFSET(FAntiCheatDataPacket, Timestamp), METADATA_PARAMS(UE_ARRAY_COUNT(NewProp_Timestamp_MetaData), NewProp_Timestamp_MetaData) };
const UECodeGen_Private::FStructPropertyParams Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_Location = { "Location", nullptr, (EPropertyFlags)0x0010000000000000, UECodeGen_Private::EPropertyGenFlags::Struct, RF_Public|RF_Transient|RF_MarkAsNative, nullptr, nullptr, 1, STRUCT_OFFSET(FAntiCheatDataPacket, Location), Z_Construct_UScriptStruct_FVector, METADATA_PARAMS(UE_ARRAY_COUNT(NewProp_Location_MetaData), NewProp_Location_MetaData) };
const UECodeGen_Private::FFloatPropertyParams Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_Speed = { "Speed", nullptr, (EPropertyFlags)0x0010000000000000, UECodeGen_Private::EPropertyGenFlags::Float, RF_Public|RF_Transient|RF_MarkAsNative, nullptr, nullptr, 1, STRUCT_OFFSET(FAntiCheatDataPacket, Speed), METADATA_PARAMS(UE_ARRAY_COUNT(NewProp_Speed_MetaData), NewProp_Speed_MetaData) };
const UECodeGen_Private::FStructPropertyParams Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_Rotation = { "Rotation", nullptr, (EPropertyFlags)0x0010000000000000, UECodeGen_Private::EPropertyGenFlags::Struct, RF_Public|RF_Transient|RF_MarkAsNative, nullptr, nullptr, 1, STRUCT_OFFSET(FAntiCheatDataPacket, Rotation), Z_Construct_UScriptStruct_FRotator, METADATA_PARAMS(UE_ARRAY_COUNT(NewProp_Rotation_MetaData), NewProp_Rotation_MetaData) };
const UECodeGen_Private::FStructPropertyParams Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_DeltaRotation = { "DeltaRotation", nullptr, (EPropertyFlags)0x0010000000000000, UECodeGen_Private::EPropertyGenFlags::Struct, RF_Public|RF_Transient|RF_MarkAsNative, nullptr, nullptr, 1, STRUCT_OFFSET(FAntiCheatDataPacket, DeltaRotation), Z_Construct_UScriptStruct_FRotator, METADATA_PARAMS(UE_ARRAY_COUNT(NewProp_DeltaRotation_MetaData), NewProp_DeltaRotation_MetaData) };
const UECodeGen_Private::FFloatPropertyParams Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_CurrentHP = { "CurrentHP", nullptr, (EPropertyFlags)0x0010000000000000, UECodeGen_Private::EPropertyGenFlags::Float, RF_Public|RF_Transient|RF_MarkAsNative, nullptr, nullptr, 1, STRUCT_OFFSET(FAntiCheatDataPacket, CurrentHP), METADATA_PARAMS(UE_ARRAY_COUNT(NewProp_CurrentHP_MetaData), NewProp_CurrentHP_MetaData) };
const UECodeGen_Private::FFloatPropertyParams Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_TargetDistance = { "TargetDistance", nullptr, (EPropertyFlags)0x0010000000000000, UECodeGen_Private::EPropertyGenFlags::Float, RF_Public|RF_Transient|RF_MarkAsNative, nullptr, nullptr, 1, STRUCT_OFFSET(FAntiCheatDataPacket, TargetDistance), METADATA_PARAMS(UE_ARRAY_COUNT(NewProp_TargetDistance_MetaData), NewProp_TargetDistance_MetaData) };
const UECodeGen_Private::FFloatPropertyParams Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_TargetAngle = { "TargetAngle", nullptr, (EPropertyFlags)0x0010000000000000, UECodeGen_Private::EPropertyGenFlags::Float, RF_Public|RF_Transient|RF_MarkAsNative, nullptr, nullptr, 1, STRUCT_OFFSET(FAntiCheatDataPacket, TargetAngle), METADATA_PARAMS(UE_ARRAY_COUNT(NewProp_TargetAngle_MetaData), NewProp_TargetAngle_MetaData) };
void Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_bIsTargetVisible_SetBit(void* Obj)
{
	((FAntiCheatDataPacket*)Obj)->bIsTargetVisible = 1;
}
const UECodeGen_Private::FBoolPropertyParams Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_bIsTargetVisible = { "bIsTargetVisible", nullptr, (EPropertyFlags)0x0010000000000000, UECodeGen_Private::EPropertyGenFlags::Bool | UECodeGen_Private::EPropertyGenFlags::NativeBool, RF_Public|RF_Transient|RF_MarkAsNative, nullptr, nullptr, 1, sizeof(bool), sizeof(FAntiCheatDataPacket), &Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_bIsTargetVisible_SetBit, METADATA_PARAMS(UE_ARRAY_COUNT(NewProp_bIsTargetVisible_MetaData), NewProp_bIsTargetVisible_MetaData) };
const UECodeGen_Private::FPropertyParamsBase* const Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::PropPointers[] = {
	(const UECodeGen_Private::FPropertyParamsBase*)&Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_UserID,
	(const UECodeGen_Private::FPropertyParamsBase*)&Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_Timestamp,
	(const UECodeGen_Private::FPropertyParamsBase*)&Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_Location,
	(const UECodeGen_Private::FPropertyParamsBase*)&Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_Speed,
	(const UECodeGen_Private::FPropertyParamsBase*)&Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_Rotation,
	(const UECodeGen_Private::FPropertyParamsBase*)&Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_DeltaRotation,
	(const UECodeGen_Private::FPropertyParamsBase*)&Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_CurrentHP,
	(const UECodeGen_Private::FPropertyParamsBase*)&Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_TargetDistance,
	(const UECodeGen_Private::FPropertyParamsBase*)&Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_TargetAngle,
	(const UECodeGen_Private::FPropertyParamsBase*)&Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewProp_bIsTargetVisible,
};
static_assert(UE_ARRAY_COUNT(Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::PropPointers) < 2048);
const UECodeGen_Private::FStructParams Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::StructParams = {
	(UObject* (*)())Z_Construct_UPackage__Script_AntiCheatPluginRuntime,
	nullptr,
	&NewStructOps,
	"AntiCheatDataPacket",
	Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::PropPointers,
	UE_ARRAY_COUNT(Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::PropPointers),
	sizeof(FAntiCheatDataPacket),
	alignof(FAntiCheatDataPacket),
	RF_Public|RF_Transient|RF_MarkAsNative,
	EStructFlags(0x00000001),
	METADATA_PARAMS(UE_ARRAY_COUNT(Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::Struct_MetaDataParams), Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::Struct_MetaDataParams)
};
UScriptStruct* Z_Construct_UScriptStruct_FAntiCheatDataPacket()
{
	if (!Z_Registration_Info_UScriptStruct_FAntiCheatDataPacket.InnerSingleton)
	{
		UECodeGen_Private::ConstructUScriptStruct(Z_Registration_Info_UScriptStruct_FAntiCheatDataPacket.InnerSingleton, Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::StructParams);
	}
	return Z_Registration_Info_UScriptStruct_FAntiCheatDataPacket.InnerSingleton;
}
// ********** End ScriptStruct FAntiCheatDataPacket ************************************************

// ********** Begin Class UAntiCheatDataCollector Function CollectAndlog ***************************
struct Z_Construct_UFunction_UAntiCheatDataCollector_CollectAndlog_Statics
{
#if WITH_METADATA
	static constexpr UECodeGen_Private::FMetaDataPairParam Function_MetaDataParams[] = {
#if !UE_BUILD_SHIPPING
		{ "Comment", "/**\n\x09 * \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xcd\xb8\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xcf\xb0\xef\xbf\xbd \xef\xbf\xbd\xce\xb1\xd7\xb8\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xd9\xbd\xef\xbf\xbd \xef\xbf\xbd\xd4\xbc\xef\xbf\xbd\n\x09 * \xc5\xb8\xef\xbf\xbd\xcc\xb8\xd3\xbf\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xc8\xa3\xef\xbf\xbd\xef\xbf\xbd\xc7\xb9\xc7\xb7\xef\xbf\xbd UFUNCTION() \xef\xbf\xbd\xef\xbf\xbd\xc5\xa9\xef\xbf\xbd\xce\xb0\xef\xbf\xbd \xef\xbf\xbd\xca\xbf\xef\xbf\xbd\n\x09 */" },
#endif
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
#if !UE_BUILD_SHIPPING
		{ "ToolTip", "\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xcd\xb8\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xcf\xb0\xef\xbf\xbd \xef\xbf\xbd\xce\xb1\xd7\xb8\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xd9\xbd\xef\xbf\xbd \xef\xbf\xbd\xd4\xbc\xef\xbf\xbd\n\xc5\xb8\xef\xbf\xbd\xcc\xb8\xd3\xbf\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xc8\xa3\xef\xbf\xbd\xef\xbf\xbd\xc7\xb9\xc7\xb7\xef\xbf\xbd UFUNCTION() \xef\xbf\xbd\xef\xbf\xbd\xc5\xa9\xef\xbf\xbd\xce\xb0\xef\xbf\xbd \xef\xbf\xbd\xca\xbf\xef\xbf\xbd" },
#endif
	};
#endif // WITH_METADATA
	static const UECodeGen_Private::FFunctionParams FuncParams;
};
const UECodeGen_Private::FFunctionParams Z_Construct_UFunction_UAntiCheatDataCollector_CollectAndlog_Statics::FuncParams = { { (UObject*(*)())Z_Construct_UClass_UAntiCheatDataCollector, nullptr, "CollectAndlog", nullptr, 0, 0, RF_Public|RF_Transient|RF_MarkAsNative, (EFunctionFlags)0x00040401, 0, 0, METADATA_PARAMS(UE_ARRAY_COUNT(Z_Construct_UFunction_UAntiCheatDataCollector_CollectAndlog_Statics::Function_MetaDataParams), Z_Construct_UFunction_UAntiCheatDataCollector_CollectAndlog_Statics::Function_MetaDataParams)},  };
UFunction* Z_Construct_UFunction_UAntiCheatDataCollector_CollectAndlog()
{
	static UFunction* ReturnFunction = nullptr;
	if (!ReturnFunction)
	{
		UECodeGen_Private::ConstructUFunction(&ReturnFunction, Z_Construct_UFunction_UAntiCheatDataCollector_CollectAndlog_Statics::FuncParams);
	}
	return ReturnFunction;
}
DEFINE_FUNCTION(UAntiCheatDataCollector::execCollectAndlog)
{
	P_FINISH;
	P_NATIVE_BEGIN;
	P_THIS->CollectAndlog();
	P_NATIVE_END;
}
// ********** End Class UAntiCheatDataCollector Function CollectAndlog *****************************

// ********** Begin Class UAntiCheatDataCollector **************************************************
void UAntiCheatDataCollector::StaticRegisterNativesUAntiCheatDataCollector()
{
	UClass* Class = UAntiCheatDataCollector::StaticClass();
	static const FNameNativePtrPair Funcs[] = {
		{ "CollectAndlog", &UAntiCheatDataCollector::execCollectAndlog },
	};
	FNativeFunctionRegistrar::RegisterFunctions(Class, Funcs, UE_ARRAY_COUNT(Funcs));
}
FClassRegistrationInfo Z_Registration_Info_UClass_UAntiCheatDataCollector;
UClass* UAntiCheatDataCollector::GetPrivateStaticClass()
{
	using TClass = UAntiCheatDataCollector;
	if (!Z_Registration_Info_UClass_UAntiCheatDataCollector.InnerSingleton)
	{
		GetPrivateStaticClassBody(
			StaticPackage(),
			TEXT("AntiCheatDataCollector"),
			Z_Registration_Info_UClass_UAntiCheatDataCollector.InnerSingleton,
			StaticRegisterNativesUAntiCheatDataCollector,
			sizeof(TClass),
			alignof(TClass),
			TClass::StaticClassFlags,
			TClass::StaticClassCastFlags(),
			TClass::StaticConfigName(),
			(UClass::ClassConstructorType)InternalConstructor<TClass>,
			(UClass::ClassVTableHelperCtorCallerType)InternalVTableHelperCtorCaller<TClass>,
			UOBJECT_CPPCLASS_STATICFUNCTIONS_FORCLASS(TClass),
			&TClass::Super::StaticClass,
			&TClass::WithinClass::StaticClass
		);
	}
	return Z_Registration_Info_UClass_UAntiCheatDataCollector.InnerSingleton;
}
UClass* Z_Construct_UClass_UAntiCheatDataCollector_NoRegister()
{
	return UAntiCheatDataCollector::GetPrivateStaticClass();
}
struct Z_Construct_UClass_UAntiCheatDataCollector_Statics
{
#if WITH_METADATA
	static constexpr UECodeGen_Private::FMetaDataPairParam Class_MetaDataParams[] = {
		{ "BlueprintSpawnableComponent", "" },
		{ "ClassGroupNames", "AntiCheat" },
#if !UE_BUILD_SHIPPING
		{ "Comment", "/*\n * UAntiCheatDataCollector\n * \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd(\xc4\xa1\xef\xbf\xbd\xef\xbf\xbd) \xc5\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xc3\xb7\xef\xbf\xbd\xef\xbf\xbd\xcc\xbe\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xcd\xb8\xef\xbf\xbd \xef\xbf\xbd\xd6\xb1\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xcf\xb4\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xc6\xae\n */" },
#endif
		{ "IncludePath", "AntiCheatDataCollector.h" },
		{ "ModuleRelativePath", "Public/AntiCheatDataCollector.h" },
#if !UE_BUILD_SHIPPING
		{ "ToolTip", "* UAntiCheatDataCollector\n* \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd(\xc4\xa1\xef\xbf\xbd\xef\xbf\xbd) \xc5\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xc3\xb7\xef\xbf\xbd\xef\xbf\xbd\xcc\xbe\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xcd\xb8\xef\xbf\xbd \xef\xbf\xbd\xd6\xb1\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xcf\xb4\xef\xbf\xbd \xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xef\xbf\xbd\xc6\xae" },
#endif
	};
#endif // WITH_METADATA
	static UObject* (*const DependentSingletons[])();
	static constexpr FClassFunctionLinkInfo FuncInfo[] = {
		{ &Z_Construct_UFunction_UAntiCheatDataCollector_CollectAndlog, "CollectAndlog" }, // 2939231334
	};
	static_assert(UE_ARRAY_COUNT(FuncInfo) < 2048);
	static constexpr FCppClassTypeInfoStatic StaticCppClassTypeInfo = {
		TCppClassTypeTraits<UAntiCheatDataCollector>::IsAbstract,
	};
	static const UECodeGen_Private::FClassParams ClassParams;
};
UObject* (*const Z_Construct_UClass_UAntiCheatDataCollector_Statics::DependentSingletons[])() = {
	(UObject* (*)())Z_Construct_UClass_UActorComponent,
	(UObject* (*)())Z_Construct_UPackage__Script_AntiCheatPluginRuntime,
};
static_assert(UE_ARRAY_COUNT(Z_Construct_UClass_UAntiCheatDataCollector_Statics::DependentSingletons) < 16);
const UECodeGen_Private::FClassParams Z_Construct_UClass_UAntiCheatDataCollector_Statics::ClassParams = {
	&UAntiCheatDataCollector::StaticClass,
	"Engine",
	&StaticCppClassTypeInfo,
	DependentSingletons,
	FuncInfo,
	nullptr,
	nullptr,
	UE_ARRAY_COUNT(DependentSingletons),
	UE_ARRAY_COUNT(FuncInfo),
	0,
	0,
	0x00B000A4u,
	METADATA_PARAMS(UE_ARRAY_COUNT(Z_Construct_UClass_UAntiCheatDataCollector_Statics::Class_MetaDataParams), Z_Construct_UClass_UAntiCheatDataCollector_Statics::Class_MetaDataParams)
};
UClass* Z_Construct_UClass_UAntiCheatDataCollector()
{
	if (!Z_Registration_Info_UClass_UAntiCheatDataCollector.OuterSingleton)
	{
		UECodeGen_Private::ConstructUClass(Z_Registration_Info_UClass_UAntiCheatDataCollector.OuterSingleton, Z_Construct_UClass_UAntiCheatDataCollector_Statics::ClassParams);
	}
	return Z_Registration_Info_UClass_UAntiCheatDataCollector.OuterSingleton;
}
DEFINE_VTABLE_PTR_HELPER_CTOR(UAntiCheatDataCollector);
UAntiCheatDataCollector::~UAntiCheatDataCollector() {}
// ********** End Class UAntiCheatDataCollector ****************************************************

// ********** Begin Registration *******************************************************************
struct Z_CompiledInDeferFile_FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h__Script_AntiCheatPluginRuntime_Statics
{
	static constexpr FStructRegisterCompiledInInfo ScriptStructInfo[] = {
		{ FAntiCheatDataPacket::StaticStruct, Z_Construct_UScriptStruct_FAntiCheatDataPacket_Statics::NewStructOps, TEXT("AntiCheatDataPacket"), &Z_Registration_Info_UScriptStruct_FAntiCheatDataPacket, CONSTRUCT_RELOAD_VERSION_INFO(FStructReloadVersionInfo, sizeof(FAntiCheatDataPacket), 808033104U) },
	};
	static constexpr FClassRegisterCompiledInInfo ClassInfo[] = {
		{ Z_Construct_UClass_UAntiCheatDataCollector, UAntiCheatDataCollector::StaticClass, TEXT("UAntiCheatDataCollector"), &Z_Registration_Info_UClass_UAntiCheatDataCollector, CONSTRUCT_RELOAD_VERSION_INFO(FClassReloadVersionInfo, sizeof(UAntiCheatDataCollector), 20549357U) },
	};
};
static FRegisterCompiledInInfo Z_CompiledInDeferFile_FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h__Script_AntiCheatPluginRuntime_4138086323(TEXT("/Script/AntiCheatPluginRuntime"),
	Z_CompiledInDeferFile_FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h__Script_AntiCheatPluginRuntime_Statics::ClassInfo, UE_ARRAY_COUNT(Z_CompiledInDeferFile_FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h__Script_AntiCheatPluginRuntime_Statics::ClassInfo),
	Z_CompiledInDeferFile_FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h__Script_AntiCheatPluginRuntime_Statics::ScriptStructInfo, UE_ARRAY_COUNT(Z_CompiledInDeferFile_FID_Users_USER_Desktop_SecurityUE5_LyraStarterGame_Plugins_GameFeatures_AntiCheatPlugin_Source_AntiCheatPluginRuntime_Public_AntiCheatDataCollector_h__Script_AntiCheatPluginRuntime_Statics::ScriptStructInfo),
	nullptr, 0);
// ********** End Registration *********************************************************************

PRAGMA_ENABLE_DEPRECATION_WARNINGS
