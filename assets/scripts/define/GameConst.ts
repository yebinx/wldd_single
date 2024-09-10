


export enum EDateType {
    year,
    month,
    day,
}

export enum TItemtype {
    ITEM_TYPE_NIL = 0x00,  // 空
    ITEM_TYPE_WILD = 0x01,  // 百搭可代替所有图标，除了夺宝
    ITEM_TYPE_SCATTER = 0x02,  // 夺宝


    ITEM_TYPE_H1 = 0x03,  // 大盗
    ITEM_TYPE_H2 = 0x04,  // 吉他
    ITEM_TYPE_H3 = 0x05,  // 饮料
    ITEM_TYPE_H4 = 0x06,  // 彩球
    ITEM_TYPE_A = 0x07,  // A
    ITEM_TYPE_K = 0x08,  // K
    ITEM_TYPE_Q = 0x09,  // Q
    ITEM_TYPE_J = 0x0A,  // J
    ITEM_TYPE_10 = 0x0B,  // 10


    GOLD_MOD = 0x10,  // 金色模组取色用

    ITEM_TYPE_H1_GOLD = 0x13,  //
    ITEM_TYPE_H2_GOLD = 0x14,  //
    ITEM_TYPE_H3_GOLD = 0x15,  //
    ITEM_TYPE_H4_GOLD = 0x16,  //
    ITEM_TYPE_A_GOLD = 0x17,  // A
    ITEM_TYPE_K_GOLD = 0x18,  // K
    ITEM_TYPE_Q_GOLD = 0x19,  // Q
    ITEM_TYPE_J_GOLD = 0x1A,  // J
    ITEM_TYPE_10_GOLD = 0x1B,  // 10
}

export default class GameConst {
    /**掉落时间间隔 */
    static fallDownInterval: number = 0.1;

    /**掉落时间 */
    static fallDownTime: number = 0.2;

    /**最大行数 */
    static MaxRow: number = 6;

    /**登录最大重试次数 */
    static MaxReLoginCnt: number = 5;

    static ElementList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 19, 20, 21, 22, 23, 24, 25, 26, 27];

    static WDElementId = 1

    /**基础倍数 */
    static BeseGold: number = 1000;

    /**赔付表 */
    static ElementRateList: Map<TItemtype, {
        num: number,
        multiple: number
    }[] | string[]> = new Map([
        [TItemtype.ITEM_TYPE_WILD, ["百搭符号可替代除夺宝符号外的所有符号。"]],
        [TItemtype.ITEM_TYPE_SCATTER, ["3个夺宝符号可触发免费旋转。"]],
        [TItemtype.ITEM_TYPE_H1, [{
            num: 5,
            multiple: 50
        }, {
            num: 4,
            multiple: 25
        }, {
            num: 3,
            multiple: 10
        }]],
        [TItemtype.ITEM_TYPE_H2, [{
            num: 5,
            multiple: 40
        }, {
            num: 4,
            multiple: 20
        }, {
            num: 3,
            multiple: 8
        }]],
        [TItemtype.ITEM_TYPE_H3, [{
            num: 5,
            multiple: 30
        }, {
            num: 4,
            multiple: 15
        }, {
            num: 3,
            multiple: 6
        }]],
        [TItemtype.ITEM_TYPE_H4, [{
            num: 5,
            multiple: 15
        }, {
            num: 4,
            multiple: 10
        }, {
            num: 3,
            multiple: 5
        }]],
        [TItemtype.ITEM_TYPE_A, [{
            num: 5,
            multiple: 12
        }, {
            num: 4,
            multiple: 5
        }, {
            num: 3,
            multiple: 3
        }]],
        [TItemtype.ITEM_TYPE_K, [{
            num: 5,
            multiple: 12
        }, {
            num: 4,
            multiple: 5
        }, {
            num: 3,
            multiple: 3
        }]],
        [TItemtype.ITEM_TYPE_Q, [{
            num: 5,
            multiple: 10
        }, {
            num: 4,
            multiple: 4
        }, {
            num: 3,
            multiple: 2
        }]],
        [TItemtype.ITEM_TYPE_J, [{
            num: 5,
            multiple: 6
        }, {
            num: 4,
            multiple: 3
        }, {
            num: 3,
            multiple: 1
        }]],
        [TItemtype.ITEM_TYPE_10, [{
            num: 5,
            multiple: 6
        }, {
            num: 4,
            multiple: 3
        }, {
            num: 3,
            multiple: 1
        }]],

        [TItemtype.ITEM_TYPE_H1_GOLD, [{
            num: 5,
            multiple: 50
        }, {
            num: 4,
            multiple: 25
        }, {
            num: 3,
            multiple: 10
        }]],
        [TItemtype.ITEM_TYPE_H2_GOLD, [{
            num: 5,
            multiple: 40
        }, {
            num: 4,
            multiple: 20
        }, {
            num: 3,
            multiple: 8
        }]],
        [TItemtype.ITEM_TYPE_H3_GOLD, [{
            num: 5,
            multiple: 30
        }, {
            num: 4,
            multiple: 15
        }, {
            num: 3,
            multiple: 6
        }]],
        [TItemtype.ITEM_TYPE_H4_GOLD, [{
            num: 5,
            multiple: 15
        }, {
            num: 4,
            multiple: 10
        }, {
            num: 3,
            multiple: 5
        }]],
        [TItemtype.ITEM_TYPE_A_GOLD, [{
            num: 5,
            multiple: 12
        }, {
            num: 4,
            multiple: 5
        }, {
            num: 3,
            multiple: 3
        }]],
        [TItemtype.ITEM_TYPE_K_GOLD, [{
            num: 5,
            multiple: 12
        }, {
            num: 4,
            multiple: 5
        }, {
            num: 3,
            multiple: 3
        }]],
        [TItemtype.ITEM_TYPE_Q_GOLD, [{
            num: 5,
            multiple: 10
        }, {
            num: 4,
            multiple: 4
        }, {
            num: 3,
            multiple: 2
        }]],
        [TItemtype.ITEM_TYPE_J_GOLD, [{
            num: 5,
            multiple: 6
        }, {
            num: 4,
            multiple: 3
        }, {
            num: 3,
            multiple: 1
        }]],
        [TItemtype.ITEM_TYPE_10_GOLD, [{
            num: 5,
            multiple: 6
        }, {
            num: 4,
            multiple: 3
        }, {
            num: 3,
            multiple: 1
        }]],
    ])
}

export enum GameState {
    wait,//等待
    roll,//转动
    show_result,//显示结果
    start_stop_roll,//停止转动
    cancel_roll,//提前停止转动
    delay,//新增一个阶段可以取消快速旋转
}