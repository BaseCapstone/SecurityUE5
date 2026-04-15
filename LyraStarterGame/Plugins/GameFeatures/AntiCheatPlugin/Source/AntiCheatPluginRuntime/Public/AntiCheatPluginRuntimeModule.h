#pragma once 

#include "Modules/ModuleManager.h"


/**
 * FAntiCheatPluginRuntimeModule
 * 안티치트 플러그인의 생명주기를 관리하는 메인 모듈 클래스
 * 게임이 실행되거나 플러그인이 로드될 때 감시 시스템을 초기화하는 역할.
 */

class FAntiCheatPluginRuntimeModule : public IModuleInterface
{
public:
    /**
     * 플러그인이 메모리에 로드될 때 실행
     * 주로 전역 이벤트(델리게이트) 바인딩이나 초기 설정 로직을 여기서 수행
     */
    virtual void StartupModule() override;

    /**
     * 플러그인이 종료되거나 언로드될 때 실행
     * StartupModule에서 등록했던 이벤트 해제나 메모리 정리 등을 수행.
     */
    virtual void ShutdownModule() override;

private:
    /**
     * 새로운 게임 월드(World)가 생성 및 초기화되었을 때 호출될 콜백 함수
     * @param World 생성된 월드 객체
     * @param IVS 월드 초기화 시 사용된 설정값들
     * * 활용: 월드가 시작될 때마다 플레이어를 찾아 'AntiCheatDataCollector'를 
               자동으로 부착하거나 감시를 시작하는 용도로 사용
     */
    void OnWorldInitialized(UWorld* World, const UWorld::InitializationValues IVS);
};