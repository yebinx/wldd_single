import { log, warn } from "cc";
import { AudioManager } from "../kernel/compat/audio/AudioManager";
import { ResInfo } from "../kernel/compat/load/ResInfo";
import MathUtil from "../kernel/core/utils/MathUtil";



export enum BgmType {
    normal,
    free,
    play_big_award,
}

export default class GameAudio {

    private static _curBgm: ResInfo = null;

    static switchBgm(bgType: BgmType) {
        let next = null;
        switch (bgType) {
            case BgmType.normal:
                next = { respath: "audio/bgm_mg", bundleName: "game" };
                break;
            case BgmType.free:
                next = { respath: "audio/bgm_fs", bundleName: "game" };
                break;
        }
        // if (JSON.stringify(next) == JSON.stringify(this._curBgm)) {
        //     return;
        // }
        AudioManager.inst.playBGM(next);
        this._curBgm = next;
    }

    static resumeBgm() {
        if (!this._curBgm) { return; }
        AudioManager.inst.resumeBGM();
    }

    //----------------------------------------------------------------

    //开始旋转
    static startSpin() {
        AudioManager.inst.playEffet({ respath: "audio/FX-27", bundleName: "game" });
    }

    //点击按钮
    static clickSystem() {
        AudioManager.inst.playEffet({ respath: "audio/menu_icon_press", bundleName: "game" });
    }

    //点击按钮
    static clickClose() {
        AudioManager.inst.playEffet({ respath: "audio/list_item_click", bundleName: "game" }, 3);
    }

    //普通中奖结算
    static normalWinEnd() {
        AudioManager.inst.playEffet({ respath: "audio/normal_win_end", bundleName: "game" });
    }

    /**卷轴滚动声音 */
    static juanzhouRoll() {
        AudioManager.inst.stopMusic();
        AudioManager.inst.playMusic({ respath: "audio/FX-24", bundleName: "game" }, true)
    }

    /**百搭出现 */
    static wdChuxian() {
        AudioManager.inst.playEffet({ respath: "audio/FX-23", bundleName: "game" });
    }

    static stopBigAward() {
        AudioManager.inst.resumeBGM();
        AudioManager.inst.stopMusic();
    }

    static clickShowRateTip() {
        AudioManager.inst.playEffet({ respath: "audio/FX-31", bundleName: "game" });
    }

    static bigWinEnd() {
        AudioManager.inst.stopMusic();
        AudioManager.inst.playEffet({ respath: "audio/bgm_bigwin_end", bundleName: "game" });
    }

    static bigWin() {
        AudioManager.inst.pauseBGM();
        AudioManager.inst.stopMusic();
        AudioManager.inst.playMusic({ respath: "audio/bgm_bigwin_main", bundleName: "game" });
    }

    //--------------------------------------------new------------------------------------------
    static scatterStop() {
        AudioManager.inst.playEffet({ respath: "audio/FX-28", bundleName: "game" });
    }

    static scatterEffect() {
        AudioManager.inst.playMusic({ respath: "audio/FX-2", bundleName: "game" });
    }

    static normalRollStop() {
        AudioManager.inst.playEffet({ respath: "audio/FX-25", bundleName: "game" });
    }

    static turboRollStop() {
        AudioManager.inst.playEffet({ respath: "audio/FX-26", bundleName: "game" });
    }

    static winFree() {
        AudioManager.inst.playEffet({ respath: "audio/FX-28", bundleName: "game" });
    }
    
    static wheelRecover() {
        AudioManager.inst.playEffet({ respath: "audio/FX-27", bundleName: "game" });
    }
    
    static wheelRoll() {
        AudioManager.inst.playEffet({ respath: "audio/FX-15", bundleName: "game" });
    }

    /**消除 */
    static eliminate() {
        AudioManager.inst.playEffet({ respath: "audio/FX-16", bundleName: "game" });
    }

    static freeSettlement() {
        AudioManager.inst.stopMusic();
        AudioManager.inst.playMusic({ respath: "audio/bgm_totalwin_main", bundleName: "game" });
    }

    static freeSettlementEnd() {
        AudioManager.inst.stopMusic();
        AudioManager.inst.playMusic({ respath: "audio/bgm_totalwin_end", bundleName: "game" });
        warn("end");
    }

    static intoFree() {
        AudioManager.inst.playEffet({ respath: "audio/FX-5", bundleName: "game" });
    }

    static longJuan() {
        AudioManager.inst.playEffet({ respath: "audio/FX-6", bundleName: "game" });
    }

    static freeAward() {
        AudioManager.inst.playEffet({ respath: "audio/FX-30", bundleName: "game" });
    }

    static roundTotalWin() {
        AudioManager.inst.playMusic({ respath: "audio/FX-7", bundleName: "game" });
    }

    static roundTotalWinEnd() {
        AudioManager.inst.playEffet({ respath: "audio/FX-8", bundleName: "game" });
    }

    static iconWin() {
        let list = [17, 18, 19, 20, 21];
        let idx = Math.floor(Math.random() * list.length);
        AudioManager.inst.playEffet({ respath: "audio/FX-" + list[idx], bundleName: "game" });
    }

    static winWheelRate(rate: number) {
        let list = [9, 10, 11, 12, 13];
        let idx = rate - 2;
        if (idx < 0) {
            return;
        }
        if (idx >= list.length) {
            idx = list.length - 1;
        }
        AudioManager.inst.playEffet({ respath: "audio/FX-" + list[idx], bundleName: "game" });
    }

    static iconChangeWd() {
        AudioManager.inst.playEffet({ respath: "audio/icon_change_wd", bundleName: "game" }, 0.5);
    }

    static iconBoom() {
        AudioManager.inst.playEffet({ respath: "audio/icon_boom", bundleName: "game" }, 0.5);
    }

}


