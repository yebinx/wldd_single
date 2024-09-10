import { _decorator, Component, error, instantiate, Label, Node, Prefab, Sprite, SpriteFrame, UIOpacity, warn } from 'cc';
import CocosUtil from '../../kernel/compat/CocosUtil';
import { BaseComp } from '../../kernel/compat/view/BaseComp';
import MoneyUtil from '../../kernel/core/utils/MoneyUtil';
import StringUtil from '../../kernel/core/utils/StringUtil';
import { RecordDetailInfo, RoundDetailInfo } from '../../interface/recorddetail';
import { HisElementItem } from './HisElementItem';
import { HisLineAward } from './HisLineAward';
import { CompDissItem } from './CompDissItem';
import BigNumber from 'bignumber.js';
import GameConst, { TItemtype } from '../../define/GameConst';
const { ccclass, property } = _decorator;




@ccclass('CompHisPage')
export class CompHisPage extends BaseComp {
    @property(Node)
    ndElementParent: Node;
    @property(Node)
    ndIsAward: Node;
    @property(Prefab)
    prfAwardLine: Prefab
    @property(SpriteFrame)
    sprites: SpriteFrame[] = [];
    @property(Node)
    ndAwardLineParent: Node;

    protected onLoad(): void {
    }

    setData(data: RoundDetailInfo, isFree: boolean, hasNext: boolean) {
        let labs: { [key: string]: Label } = {};
        CocosUtil.traverseNodes(this.node, this.m_ui)
        CocosUtil.traverseLabels(this.node, labs)
        labs.lb_order_no.string = StringUtil.lineStr(data.round_no) || ""; // 交易单号
        labs.lb_bet_num.string = (data.bet && MoneyUtil.rmbStr(data.bet)) || "0.00"; //投注
        labs.lb_profit_num.string = MoneyUtil.rmbStr(data.player_win_lose);
        labs.lb_balance_num.string = (data.balance && MoneyUtil.rmbStr(data.balance)) || "0.00"; //余额
        labs.lb_betvalue.string = "投注大小 " + ((data.bet_size && MoneyUtil.rmbStr(data.bet_size)) || "0.00"); //投注大小
        labs.lb_betrate.string = "投注倍数 " + (data.bet_multiple || "0.00"); //投注倍数
        if (data.round == 1 && !(data.prize_list?.length)) {
            labs.lb_round.string = ``;
            this.m_ui.db_3.active = false;
        } else {
            labs.lb_round.string = `第${data.round.toString()}回合`;
            this.m_ui.db_3.active = true;
        }
        this.ndIsAward.active = !data.prize_list || data.prize_list.length == 0;
        this.m_ui.mulLabel.getComponent(Label).string = "奖金倍数 x" + data.multi_time.toString();
        this.m_ui.free_wheel.active = isFree;
        this.m_ui.free_bg.active = isFree;

        this.jumpSpecifyLocation(data.multi_time);

        data.item_type_list.forEach((item, idx) => {
            this.ndElementParent.children[idx].children[0].getComponent(Sprite).spriteFrame = this.sprites[item];
        })

        if (data.prize_list) {
            data.prize_list.forEach((msg, idx) => {
                let node = instantiate(this.prfAwardLine);
                this.ndAwardLineParent.addChild(node);
                let ways = this.getWaysNum(msg.win_pos_list);
                node.getChildByName("icon").getComponent(Sprite).spriteFrame = this.sprites[msg.item_type];
                node.getChildByName("lb_ways").getComponent(Label).string = ways.num.toString() + "条中奖路";
                node.getChildByName("lb_num").getComponent(Label).string = this.getStrNum(ways.colNum) + "星连珠";
                let win = new BigNumber(data.bet_size).multipliedBy(data.bet_multiple).multipliedBy(msg.rate).multipliedBy(msg.count);
                node.getChildByName("lb_gain").getComponent(Label).string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(win.multipliedBy(data.multi_time).toNumber());
                node.getChildByName("lb_mul").getComponent(Label).string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(win.toNumber()) + " x " + data.multi_time;
                node.getChildByName("lb_free_mul").active = false;
                node.getChildByName("lb_free_num").active = false;

                let datas = [];
                datas.push(data.bet_size_s);
                datas.push(data.bet_multiple);
                datas.push(msg.rate);
                datas.push(msg.count);
                datas.push(data.multi_time);
                let tmpdata = {
                    dataArr: datas,
                    item: node,
                }
                node.getComponent(CompDissItem).init(this.m_ui.kong)
                node.getComponent(CompDissItem).setData(tmpdata)
            });
        } else {
            let scNum = this.checkScatterNum(data.item_type_list);
            if (scNum > 2) {
                let n = (scNum - 3) * 2 + 12;
                let node = instantiate(this.prfAwardLine);
                this.ndAwardLineParent.addChild(node);
                node.getChildByName("icon").getComponent(Sprite).spriteFrame = this.sprites[TItemtype.ITEM_TYPE_SCATTER];
                node.getChildByName("lb_ways").active = false;
                node.getChildByName("lb_num").active = false;
                node.getChildByName("lb_gain").active = false;
                node.getChildByName("lb_mul").active = false;
                node.getChildByName("lb_free_mul").active = true;
                node.getChildByName("lb_free_num").active = true;
                node.getChildByName("lb_free_mul").getComponent(Label).string = "x " + scNum;
                if (isFree) {
                    node.getChildByName("lb_free_num").getComponent(Label).string = "+" + n + "次免费旋转";
                } else {
                    node.getChildByName("lb_free_num").getComponent(Label).string = n + "次免费旋转";
                }
    
                // let datas = [];
                // datas.push(data.bet_size_s);
                // datas.push(data.bet_multiple);
                // datas.push(msg.rate);
                // datas.push(msg.count);
                // datas.push(data.multi_time);
                // let tmpdata = {
                //     dataArr: datas,
                //     item: node,
                // }
                // node.getComponent(CompDissItem).init(this.node)
                // node.getComponent(CompDissItem).setData(tmpdata)
            }
        }


    }

    checkScatterNum(arr: number[]) {
        let scCount = 0;
        for (let i = 0; i < arr.length; i++) {
            let ele = arr[i];
            if (ele == TItemtype.ITEM_TYPE_SCATTER) {
                scCount++;
            }
        }
        return scCount;
    }

    jumpSpecifyLocation(mul: number) {
        if (mul > 1) {
            this.m_ui.mul_box.children.forEach((node, idx) => {
                if (idx < this.m_ui.mul_box.children.length - 1) {
                    node.getComponent(Label).string = "x" + (mul + idx);
                } else {
                    node.getComponent(Label).string = "x" + (mul - 1);
                }
            });
        }
        this.setOpacity(0, this.m_ui.mul_box.children);
    }

    setOpacity(curIdx: number, multiples: Node[]) {
        multiples.forEach((node, idx) => {
            if (curIdx == idx) {
                node.getComponent(UIOpacity).opacity = 255;
            } else {
                node.getComponent(UIOpacity).opacity = 122;
            }
        });
    }

    getStrNum(num: number) {
        let str = ["一", "二", "三", "四", "五"];
        return str[num];
    }

    getWaysNum(arr: number[]) {
        arr.sort((a, b) => {
            return a - b;
        });
        let cols = [];
        for (let i = 0; i < arr.length; i++) {
            let ele = arr[i];
            let idx = Math.floor(ele / 4);
            if (!cols[idx]) {
                cols[idx] = 0;
            }
            cols[idx]++;
        }
        let num = 1;
        cols.forEach((val) => {
            if (val) {
                num *= val
            }
        });
        return { num, colNum: cols.length - 1 };
    }
}


