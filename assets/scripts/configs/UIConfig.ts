import { ResInfo } from "../kernel/compat/load/ResInfo";

export enum EViewNames {
    LoadinView,
    GameView,
    ResultBigAward,
    UIAuto,
    UIBetSetting,
    UIhistory,
    UIHisDetail,
    UIDateSelect,
    UIselectdate,
    UIpeifubiao,
    UIRule,
    UImoney,
    UIConfirmDialog,
    UIConfirmTip,
    ReconnectTip,
    UIToast,
    // UIRecord,
}


export var g_uiMap: { [key: number]: ResInfo } = {
    [EViewNames.LoadinView]: { respath: "prefabs/LoadingView", bundleName: "game" },
    [EViewNames.GameView]: { respath: "prefabs/GameView", bundleName: "game" },
    [EViewNames.ResultBigAward]: { respath: "prefabs/ResultBigAward", bundleName: "game" },
    [EViewNames.UIAuto]: { respath: "prefabs/UIAuto", bundleName: "game" },
    [EViewNames.UIBetSetting]: { respath: "prefabs/UIBetSetting", bundleName: "game" },
    [EViewNames.UIhistory]: { respath: "prefabs/UIhistory", bundleName: "game" },
    [EViewNames.UIHisDetail]: { respath: "prefabs/UIHisDetail", bundleName: "game" },
    [EViewNames.UIDateSelect]: { respath: "prefabs/UIDateSelect", bundleName: "game" },
    [EViewNames.UIselectdate]: { respath: "prefabs/UIselectdate", bundleName: "game" },
    [EViewNames.UIpeifubiao]: { respath: "prefabs/docs/UIpeifubiao", bundleName: "game" },
    [EViewNames.UIRule]: { respath: "prefabs/docs/UIRule", bundleName: "game" },
    [EViewNames.UImoney]: { respath: "prefabs/UImoney", bundleName: "game" },
    [EViewNames.UIConfirmDialog]: { respath: "prefabs/common/ConfirmDialog", bundleName: "game" },
    [EViewNames.UIConfirmTip]: { respath: "prefabs/common/ConfirmTip", bundleName: "game" },
    [EViewNames.ReconnectTip]: { respath: "prefabs/common/ReconnectTip", bundleName: "game" },
    [EViewNames.UIToast]: { respath: "prefabs/common/ConfirmDialog", bundleName: "game" },
    // [EViewNames.UIRecord]: { respath: "prefabs/record/record", bundleName: "game" },
}