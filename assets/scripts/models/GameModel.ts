import { Game, Vec2, log, v2, warn } from "cc";
import LoginCtrl from "../ctrls/LoginCtrl";
import GameConst, { TItemtype } from "../define/GameConst";
import GameEvent from "../event/GameEvent";
import { BetRsp } from "../interface/bet";
import { BetInfo, BetInfoRsp } from "../interface/betinfo";
import { TPrize, TRound } from "../interface/result";
import { GameInfo } from "../interface/userinfo";
import EventCenter from "../kernel/core/event/EventCenter";
import BaseModel from "./BaseModel";
import MathUtil from "../kernel/core/utils/MathUtil";
import { RecordInfo, RecordListRsp } from "../interface/recordlist";
import { IGameRecord, IRecordDetail, IRecordProfile, IRecordProfileSummary } from "../../shared/script/shared_record/shared_record_interface";
import { RecordDetailRsp } from "../interface/recorddetail";

export interface BaseGoldInfo {
    balance: number//玩家余额
    curBetAmount: number//当前下注的钱
    lastWinAmount: number//赢得的前
}

export interface InitUIInfo extends BaseGoldInfo {
    elementList: Array<Array<number>> //初始化元素列表
    lastResultAwardUIInfo: TRound//上局展示结果
    remainFreeTimes: number // 是否是免费中
    isEndFree: boolean //是否是免费最后一把
}
export interface InitUIAutoInfo extends BaseGoldInfo {
    selectNums: number[]
}


const rates: number[] = [5, 15, 35]

/**自动旋转的次数 */
const AutoRounds = [10, 30, 50, 80, 1000];


export interface EPoint {
    col: number,
    row: number,
    isAward?: boolean,
}

const LineToElementPosList: Array<Array<EPoint>> = [
    [
        { col: 0, row: 1 },
        { col: 1, row: 1 },
        { col: 2, row: 1 },
    ],
    [
        { col: 0, row: 2 },
        { col: 1, row: 2 },
        { col: 2, row: 2 },
    ],
    [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
    ],
    [
        { col: 0, row: 2 },
        { col: 1, row: 1 },
        { col: 2, row: 0 },
    ],
    [
        { col: 0, row: 0 },
        { col: 1, row: 1 },
        { col: 2, row: 2 },
    ],
]



export interface ResultLineInfo {
    idx: number,//编号
    win: number,//单条线赢多少钱
    ePoint: Array<EPoint>//对应二维数组位置
}

/** 一列符号 */
export interface TColSymbol {
    list: number[];
}

export interface TResult {
    /**  */
    round_list: TRound[];
    /** 本轮中奖的基本倍率 */
    rate: number;
    /** 夺宝数量 */
    scatter_count: number;
    /** 获得几次免费次数 */
    free_play: number;
    /** 开奖位置, 列*100 + 开奖idx */
    scatter_symbol_point: number[];
}

/**中奖结果展示信息 */
export interface ResultAwardUIInfo {
    balance: number;
    /** 本次所有卡牌, 0-22, */
    item_type_list: number[];
    /** 本次中奖的 */
    round_rate: number;
    /** 轮号 */
    round: number;
    /** 翻倍倍数表 */
    multi_time: number;
    /** 奖励列表 */
    prize_list: TPrize[];
    /** 下一次要出的列表 */
    next_list: number[];
    /** 数组形态, 这个形态下会出更多的内容 */
    list: TItemtypeList[];
    /** 胜利位置, 所有一起的胜利的位置 */
    win_pos_list: number[];
    /** 二维数组 */
    dyadic_list: TDyadic[];
    /** 用来垫底的列表 */
    previous_list: number[];
    /** 用来垫底的列表, 左右2个 */
    two_bottom_list: number[];
    /** 从左边往右， 从下往上 */
    col_symbol_list: TColSymbol[];
    /** 开奖位置, 列*100 + 开奖idx */
    win_symbol_point: number[];
    /**
     * int32                  win_balance       = 23; // 赢多少
     * int32                  round             = 24; // 轮号
     * int32                  rate              = 25; // 本轮总赢倍率 总额 / 线数 / 押分
     */
    free_play: number;
    /**当前赢分 */
    win: number;
}

export interface TItemtypeList {
    /** 列表 */
    item_type_list: number[];
}

/** 展示用的二维数组 */
export interface TDyadic {
    list: number[];
}

/**不中奖结果展示信息 */
export interface ResultNoAwardUIInfo {
    /**百搭元素的位置 */
    wdElementPosList: Array<EPoint>,
}

/**结果展示信息 */
export interface HHSCResultAwardUIInfo {
    resultAwardUIInfo: ResultAwardUIInfo
    showElementResult: Array<Array<number>>//最后的显示
}

// /**HHSC结果展示信息 */
// export interface ResultHHSCAwardUIInfo {
//     isNewLine: boolean,
//     awardLines: number[], //所有中奖线路
//     allElements: Array<EPoint>//所有元素 包括不中奖的
// }


export enum GameMode {
    normal,
    into_free,
    free,
    free_again,
    last_free
}

// /**进入虎虎生财模式下 传递给UI的信息 */
// export interface EnterHHSCModeUIInfo {
//     elementId: number //中奖的元素ID
//     showElementResult: Array<Array<number>> //显示的结果元素列表
// }


export default class GameModel extends BaseModel {
    /**当前下注Id */
    private curBetId: number = 0;
    /**玩家的余额 */
    balance: number = 0;
    /**最后一次赢得的钱 */
    lastWinAmount: number = 0;
    /**加减下注列表 */
    addSubCombination: number[] = []

    gameInfo: GameInfo;

    betInfo: BetInfoRsp;

    mode: GameMode = GameMode.normal;

    /**可选项倍数列表 */
    optionalMultipleLists: number[] = [];
    /**可选项下注列表 */
    optionalBetAmountLists: number[] = [];
    /**可选项总下注列表 */
    optionalTotalAmountLists: number[] = [];

    elementList: Array<Array<number>> = [];

    betData: BetRsp;
    /**虎虎生财 选中元素 */
    hhscElementId: number = 0;
    /**当前下注结果集合 */
    curBetResultRoundList: TRound[] = [];

    /**收集百搭个数 */
    collectWdCnt: number = 0;

    /**当前下注数量 */
    curBetAmount: number = 0;

    /**当前第几轮消除 */
    roundNum: number = 0;

    /**总赢奖倍数 */
    rate: number = 0;

    /**是否出现龙卷特效 */
    isShowLongJuan: boolean = false;

    /**大奖配置 */
    winConfig = [5, 15, 35];

    isEndFree: boolean = false;

    // /**记录数据 */
    // gameRecordInfo: RecordListRsp = null;

    // /**记录列表 */
    // gameRecordList: RecordInfo[] = []

    // /**详情数据 */
    // private recordDetailMap = new Map<string, RecordDetailRsp>();

    /** 改变下注数量idx*/
    // quickChangeBetAmountIdx: number = 0;

    initGameData(data: { balance: number, list: { item_type_list: number[] }[], lastWin: number, lastRound: TRound[], isEndFree: boolean }) {
        warn("initGameData", data)
        this.balance = data.balance;
        this.curBetId = this.gameInfo.last_time_bet_id || this.betInfo.default_id;
        this.setElementList(data.list);
        this.lastWinAmount = data.lastWin;
        this.curBetAmount = this.getCurBetAmount();
        this.curBetResultRoundList = data.lastRound;
        this.isEndFree = data.isEndFree;
        // this.updateChangeBetAmountIdx();
    }

    setGameInfo(info: GameInfo) {
        this.gameInfo = info;
    }

    setBetInfo(info: BetInfoRsp) {
        this.betInfo = info;
        this.setOptionalLists(info.bet_list);
    }

    getBetData() {
        return this.betData;
    }


    private setOptionalLists(betList: BetInfo[]) {
        for (let index = 0; index < betList.length; index++) {
            const element = betList[index];
            let bet_multiple = element.bet_multiple
            let bet_size = element.bet_size / GameConst.BeseGold
            let total_bet = element.total_bet / GameConst.BeseGold
            if (this.optionalMultipleLists.indexOf(bet_multiple) == -1) {
                this.optionalMultipleLists.push(bet_multiple)
            }
            if (this.optionalBetAmountLists.indexOf(bet_size) == -1) {
                this.optionalBetAmountLists.push(bet_size)
            }
            if (this.optionalTotalAmountLists.indexOf(total_bet) == -1) {
                this.optionalTotalAmountLists.push(total_bet)
            }
        }
        this.optionalMultipleLists.sort((a1, a2) => {
            return a1 - a2
        })
        this.optionalBetAmountLists.sort((a1, a2) => {
            return a1 - a2
        })
        this.optionalTotalAmountLists.sort((a1, a2) => {
            return a1 - a2
        })
    }

    getBetInfoByTotal(total: number) {
        for (let index = 0; index < this.betInfo.bet_list.length; index++) {
            let info = this.betInfo.bet_list[index];
            if (info.total_bet == total) {
                return info;
            }
        }
    }

    getBetInfoByAmount(betAmount: number, multiple: number, line: number = 0) {
        for (let index = 0; index < this.betInfo.bet_list.length; index++) {
            let betInfo = this.betInfo.bet_list[index];
            if (betInfo.bet_size == betAmount && betInfo.bet_multiple == multiple && (line == 0 || betInfo.basic_bet == line)) {
                return betInfo
            }
        }
    }

    getBetAmountIdx(amount: number) {
        for (let index = 0; index < this.optionalBetAmountLists.length; index++) {
            const element = this.optionalBetAmountLists[index];
            if (amount == element) {
                return index
            }
        }
    }

    getBetMultipleIdx(amount: number) {
        for (let index = 0; index < this.optionalMultipleLists.length; index++) {
            const element = this.optionalMultipleLists[index];
            if (amount == element) {
                return index
            }
        }
    }

    getBetTotalIdx(amount: number) {
        for (let index = 0; index < this.optionalTotalAmountLists.length; index++) {
            const element = this.optionalTotalAmountLists[index];
            if (amount == element) {
                return index
            }
        }
    }

    /**设置初始化元素信息 牌面 */
    setElementList(list: { item_type_list: number[] }[]) {
        warn("设置初始化元素信息 牌面", JSON.stringify(list))
        this.elementList = this.svrElementArrayConvertTo2Array(list)
    }

    getTestElementList() {
        return this.svrElementArrayConvertTo2Array([
            { item_type_list: [5, 9, 10, 6, 11] },
            { item_type_list: [3, 11, 4, 7, 4] },
            { item_type_list: [4, 9, 5, 10, 10] },
            { item_type_list: [3, 11, 4, 7, 4] },
            { item_type_list: [5, 9, 10, 6, 11] }
        ])
    }

    /**拼接服务器元素数据 */
    splicingServerEleData(symbolList: { list: number[] }[], nextList: number[]) {
        symbolList = JSON.parse(JSON.stringify(symbolList));
        nextList = JSON.parse(JSON.stringify(nextList));
        let elementList: Array<Array<number>> = [];
        for (let i = 0; i < symbolList.length; i++) {
            let ele = symbolList[i].list;
            ele = ele.reverse();
            ele.push(nextList[i]);
            elementList.push(ele);
        }
        let newList = [];
        elementList.forEach((list, idx) => {
            if (list.length < GameConst.MaxRow) {
                let arr = [];
                for (const key of GameConst.ElementRateList.keys()) {
                    arr.push(key);
                }
                arr.sort((a, b) => {
                    return Math.random() - 0.5;
                })
                let n = GameConst.MaxRow - list.length
                newList[idx] = [...arr.slice(0, n), ...list];
            } else {
                newList[idx] = list;
            }
        });
        warn("拼接服务器元素数据", newList);
        return newList
    }

    /**服务器一维元素数组装换客户端二维数组 */
    svrElementArrayConvertTo2Array(serverElementArray: { item_type_list: number[] }[]) {
        serverElementArray = JSON.parse(JSON.stringify(serverElementArray));

        let elementList: Array<Array<number>> = [];
        for (let i = 0; i < serverElementArray.length; i++) {
            let ele = serverElementArray[i].item_type_list;
            ele.splice(0, 0, ele.pop());
            ele = ele.reverse();
            elementList.push(ele);
        }
        elementList.forEach((list) => {
            if (list.length < GameConst.MaxRow) {
                let arr = [];
                for (const key of GameConst.ElementRateList.keys()) {
                    arr.push(key);
                }
                arr.sort((a, b) => {
                    return Math.random() - 0.5;
                });
                let n = GameConst.MaxRow - list.length;
                list.splice(0, 0, ...arr.slice(0, n))
            }
        });
        warn("服务器一维元素数组装换客户端二维数组", elementList)
        return elementList
    }

    /**服务器的pos装换为客户端二维数组行列 */
    svrPosArrayConvertToRowAndCol(serverPosArray: number[]) {
        let points: Array<EPoint> = [];
        for (let index = 0; index < serverPosArray.length; index++) {
            let pos = serverPosArray[index]
            let col = Math.floor(pos / GameConst.MaxRow)
            let row = GameConst.MaxRow - (pos % GameConst.MaxRow);
            points.push({ col: col, row: row - 1 })
        }
        return points
    }


    /**下注结果 */
    setBetResult(data: BetRsp) {
        this.betData = data;
        this.curBetAmount = data.bet
        this.balance = data.balance;
        // this.hhscElementId = data.chooseItem
        this.roundNum = 0;
        this.curBetResultRoundList = data.result.round_list;
        this.rate = data.result.rate;
        // this.lastWinAmount = data.free_game_total_win || data.prize;
        warn("下注结果", data.result.round_list);
    }

    /**是否是免费中 */
    isFree() {
        return this.mode == GameMode.free || this.mode == GameMode.free_again || this.mode == GameMode.last_free;
    }

    /**是否是免费中免费 */
    isFreeAgain() {
        return this.mode == GameMode.free_again;
    }

    /**第一次进免费 */
    isIntoFree() {
        return this.mode == GameMode.into_free;
    }

    /**最后一把免费 */
    isLastFree() {
        return this.mode == GameMode.last_free;
    }

    /**获取指定回合的结果元素数据列表 */
    getResultElementDatas(roundIdx: number) {
        let roundData = this.curBetResultRoundList[roundIdx];
        warn("获取指定回合的结果元素数据列表", roundData);
        if (roundData) {
            return this.splicingServerEleData(roundData.col_symbol_list, roundData.next_list);
        }
    }

    getRoundData(roundIdx: number) {
        return this.curBetResultRoundList[roundIdx];
    }

    /**获取指定回合的结果奖励数据列表 */
    getResultAwardUIDatas(roundIdx: number) {
        let roundData = this.curBetResultRoundList[roundIdx];
        warn("获取指定回合的结果奖励数据列表", roundIdx, roundData, this.curBetResultRoundList)
        if (roundData) {
            return roundData;
        }
    }

    /**不中奖数据 */
    getResulNoAwardUIDatas() {
        let roundData = this.curBetResultRoundList[0];
        if (roundData) {
            let wdElementPosList = this.getWdElementPosList(roundData.item_type_list)
            let noArawdInfo: ResultNoAwardUIInfo = {
                wdElementPosList: wdElementPosList,
            }
            return noArawdInfo
        }
    }

    getElementList() {
        return this.elementList;
    }

    /**界面初始化信息 */
    getInitViewInfo() {
        let last = null;
        if (this.curBetResultRoundList) {
            last = this.getResultAwardUIDatas(this.curBetResultRoundList.length - 1);
        }
        let list = null;
        if (last) {
            list = this.splicingServerEleData(last.col_symbol_list, last.next_list)
        }
        let viewInfo: InitUIInfo = {
            balance: this.balance,
            curBetAmount: this.getCurBetAmount(),
            lastWinAmount: this.lastWinAmount,
            elementList: list ? list : this.elementList,
            lastResultAwardUIInfo: last,
            remainFreeTimes: this.gameInfo.free_remain_times,
            isEndFree: this.isEndFree
        }
        return viewInfo
    }

    getCurBetId() {
        return this.curBetId
    }

    setCurBetId(id: number) {
        this.curBetId = id;
    }

    getAwardAnimationLevel(roundRate: number) {
        if (roundRate > 5) {
            return 3
        } else if (roundRate > 3) {
            return 2
        } else {
            return 1
        }
    }

    getWdElementCnt(elementList: number[]) {
        let cnt = 0;
        for (let index = 0; index < elementList.length; index++) {
            const element = elementList[index];
            if (element == GameConst.WDElementId) {
                cnt++;
            }
        }
        return cnt
    }

    getWdElementPosList(nums: number[]) {
        let wdElementPosList: Array<EPoint> = [];
        for (let index = 0; index < nums.length; index++) {
            const element = nums[index];
            if (element == GameConst.WDElementId) {
                let col = Math.floor(index / GameConst.MaxRow)
                let row = GameConst.MaxRow - index % GameConst.MaxRow - 1;
                wdElementPosList.push({ col: col, row: row })
            }
        }
        return wdElementPosList
    }

    getResultBigAwardAnimationNums(bet: number, win: number) {
        let nums: number[] = []
        let rate = win / bet;

        if (rate < rates[0]) {
            return nums
        }
        if (rate < rates[1]) {
            nums.push(win)
            return nums
        }
        if (rate < rates[2]) {
            return [rates[1] * bet, win]
        }
        return [rates[1] * bet, rates[2] * bet, win]
    }

    /**获取 大奖 巨奖 超级巨奖等级 */
    getResultBigAwardAnimationLevel(roundRate: number) {
        if (roundRate >= this.winConfig[2]) {//超级巨奖
            return 3
        } else if (roundRate >= this.winConfig[1]) {//巨奖
            return 2
        } else if (roundRate >= this.winConfig[0]) { //大奖
            return 1
        }
        return 0
    }

    getBetIdInfo(betId: number) {
        for (let index = 0; index < this.betInfo.bet_list.length; index++) {
            const element = this.betInfo.bet_list[index];
            if (element.id == betId) {
                return element;
            }
        }
    }

    getInitUIAutoData() {
        let uiData: InitUIAutoInfo = {
            balance: this.balance,
            curBetAmount: this.getCurBetAmount(),
            lastWinAmount: this.lastWinAmount,
            selectNums: AutoRounds,
        }
        return uiData
    }

    getInitUIBetSettingData() {
        let uiData: BaseGoldInfo = {
            balance: this.balance,
            curBetAmount: this.getCurBetAmount(),
            lastWinAmount: this.lastWinAmount,
        }
        return uiData
    }

    getAutoRollCntByIdx(idx: number) {
        return AutoRounds[idx]
    }

    getCurBetAmount() {
        let betId = this.curBetId
        if (betId) {
            for (let index = 0; index < this.betInfo.bet_list.length; index++) {
                const element = this.betInfo.bet_list[index];
                if (element.id == betId) {
                    return element.total_bet;
                }
            }
        }
        return 0
    }

    isMaxBet(amount: number) {
        let id = this.betInfo.addSubCombination[this.betInfo.addSubCombination.length - 1];
        let info = this.betInfo.bet_list[id - 1]
        if (amount >= info.total_bet) {
            return true
        }
        return false
    }

    isMinBet(amount: number) {
        let id = this.betInfo.addSubCombination[0];
        let info = this.betInfo.bet_list[id - 1]
        if (amount <= info.total_bet) {
            return true
        }
        return false
    }

    reduceBetAmount() {
        let curBetAmountInfo = this.betInfo.bet_list[this.curBetId - 1];
        let isSelect: boolean = false;
        for (let index = this.betInfo.addSubCombination.length - 1; index >= 0; index--) {
            const element = this.betInfo.addSubCombination[index];
            let betInfo = this.getBetIdInfo(element)
            if (betInfo.total_bet < curBetAmountInfo.total_bet) {
                this.curBetId = betInfo.id;
                isSelect = true;
                break;
            }
        }
        return this.betInfo.bet_list[this.curBetId - 1].total_bet

        // let idx = this.betInfo.addSubCombination.indexOf(this.curBetId);
        // let nextIdx = idx - 1;
        // if (nextIdx < 0) {
        //     nextIdx = 0;
        // }
        // this.curBetId = this.betInfo.addSubCombination[nextIdx];
        // return this.betInfo.bet_list[this.curBetId - 1].total_bet;
    }

    addBetAmount() {
        let curBetAmountInfo = this.betInfo.bet_list[this.curBetId - 1];
        for (let index = 0; index < this.betInfo.addSubCombination.length; index++) {
            const element = this.betInfo.addSubCombination[index];
            let betInfo = this.getBetIdInfo(element)
            if (betInfo.total_bet > curBetAmountInfo.total_bet) {
                this.curBetId = betInfo.id
                break;
            }
        }
        warn("ddddddddd", this.betInfo.bet_list, this.betInfo.addSubCombination, this.curBetId);
        return this.betInfo.bet_list[this.curBetId - 1].total_bet
        // let idx = this.betInfo.addSubCombination.indexOf(this.curBetId);
        // let nextIdx = idx + 1;
        // if (nextIdx >= this.betInfo.addSubCombination.length) {
        //     nextIdx = this.betInfo.addSubCombination.length - 1;
        // }
        // this.curBetId = this.betInfo.addSubCombination[nextIdx];
        // return this.betInfo.bet_list[this.curBetId - 1].total_bet;
    }
}