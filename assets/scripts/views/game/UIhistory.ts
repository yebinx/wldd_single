import { _decorator, Button, color, Color, Component, error, instantiate, Label, log, Node, Prefab, Tween, tween, UIOpacity, warn, Widget } from 'cc';
import { EViewNames } from '../../configs/UIConfig';
import GameEvent from '../../event/GameEvent';
import CocosUtil from '../../kernel/compat/CocosUtil';
import { BaseComp } from '../../kernel/compat/view/BaseComp';
import { UIManager } from '../../kernel/compat/view/UImanager';
import { EUILayer } from '../../kernel/compat/view/ViewDefine';
import { CpnList } from '../../kernel/compat/view/scroll/CpnList';
import { CpnListCell } from '../../kernel/compat/view/scroll/CpnListCell';
import { IListCell } from '../../kernel/compat/view/scroll/ICell';
import EventCenter from '../../kernel/core/event/EventCenter';
import DateUtil from '../../kernel/core/utils/DateUtil';
import MoneyUtil from '../../kernel/core/utils/MoneyUtil';
import GameCtrl from '../../ctrls/GameCtrl';
import Routes from '../../define/Routes';
import { GameRecordRsp } from '../../interface/record';
import { RecordListRsp } from '../../interface/recordlist';
import RecordMgr from '../../mgrs/RecordMgr';
import { PopupView } from '../../kernel/compat/view/PopupView';
import { UIActionEx } from '../common/UIActionEx';
import { ServerResult } from '../../interface/common';



const { ccclass, property } = _decorator;


@ccclass('UIhistory')
export class UIhistory extends PopupView {
    @property(Prefab)
    itemPre: Prefab = null;
    @property(Node)
    fistTip: Node = null;
    private compList: CpnList = null;

    async start() {
        await this.waitAnim(false);
        this.fistTip.active = false;
        if (GameCtrl.isFristReqRecord == false) {
            GameCtrl.isFristReqRecord = true
            // this.fistTip.active = true;
        }
        CocosUtil.traverseNodes(this.node, this.m_ui);

        CocosUtil.addClickEvent(this.m_ui.btn_close, function () {
            UIManager.closeView(EViewNames.UIhistory);
        }, this);

        CocosUtil.addClickEvent(this.m_ui.btn_filter, function () {
            UIManager.showView(EViewNames.UIselectdate, EUILayer.Dialog);
        }, this);

        CocosUtil.addClickEvent(this.m_ui.retry, async() => {
            this.m_ui.load_err.active = false;
            await this.waitAnim(false);
            this.getData();
        }, this);

        CocosUtil.addClickEvent(this.m_ui.err_close, () => {
            UIManager.closeView(EViewNames.UIhistory);
        }, this);

        EventCenter.getInstance().listen(GameEvent.ref_record_filter, this.onSearchFilterChg, this);
        // EventCenter.getInstance().listen(Routes.req_history, this.onReqHistory, this);

        this.initList();
        this.refreshList([]);

        // GameUtil.showAni(this.node);

        RecordMgr.getInstance().setFilter(1, 1);
    }

    waitAnim(isOpacity: boolean) {
        return new Promise<void>((resolve, reject) => {
            this.m_ui.loadtipBig.active = true;
            Tween.stopAllByTarget(this.m_ui.loadtipBig.getComponent(UIOpacity));
            this.m_ui.loadtipBig.getComponent(UIOpacity).opacity = 255;
            let tw = tween(this.m_ui.loadtipBig.getComponent(UIOpacity)).delay(0.5);
            if (isOpacity) {
                tw.to(0.2, { opacity: 0 }).call(() => {
                    resolve();
                }).start();
            } else {
                tw.call(() => {
                    resolve();
                }).start();
            }
        })
    }

    private initList() {
        this.compList = this.m_ui.content.addComponent(CpnList);
        let cpn = this.compList;
        cpn.config(0, this.m_ui.content.parent.parent);
        this.compList.getComScrollView().setReqCallback(this.getData, this)
        this.compList.getComScrollView().setCheckFullCallback(this.checkFullCallback, this)
        cpn.setCreateFunc(() => {
            let item = instantiate(this.itemPre);
            CocosUtil.initComponent(item, CpnListCell).setDelegate(new HistoryItem);
            return item;
        }, CocosUtil.getTemplateSize(this.itemPre));
    }

    private refreshList(arr: any[]) {
        arr = arr || RecordMgr.getInstance().getDataList();
        this.compList.setData(arr);
    }

    private async onSearchFilterChg() {
        if (RecordMgr.getInstance().filterFrom == 1) {
            this.m_ui.lb_title_filter.getComponent(Label).string = "今天";
            this.m_ui.lb_filter.getComponent(Label).string = "今天";
        } else if (RecordMgr.getInstance().filterFrom == 7) {
            this.m_ui.lb_title_filter.getComponent(Label).string = "最近7天";
            this.m_ui.lb_filter.getComponent(Label).string = "最近7天";
        } else {
            let from = DateUtil.formatDay(RecordMgr.getInstance().filterFrom, "/");
            let to = DateUtil.formatDay(RecordMgr.getInstance().filterTo, "/");
            this.m_ui.lb_title_filter.getComponent(Label).string = from + " - " + to;
            this.m_ui.lb_filter.getComponent(Label).string = from + " - " + to;;
        }
        this.refreshList([]);
        await this.waitAnim(false);
        this.getData()
    }

    async refGetData(): Promise<ServerResult<RecordListRsp>> {
        let param: any = await RecordMgr.getInstance().pullData();
        warn("refGetData", param);
        if (!param) {
            this.m_ui.load_err.active = true;
            return null
        }
        let cnt = param && param.data && param.data.count || 0;
        RecordMgr.getInstance()._dataCount = cnt;
        if (RecordMgr.getInstance().getDataList().length >= cnt) {
            return param;
        }
        if (!param || !param.data || !param.data.list) {
            return param;
        }
        RecordMgr.getInstance()._offset += 20;
        RecordMgr.getInstance().appendDatas(param);
        return param
    }

    async getData() {
        let param: any = await this.refGetData()
        tween(this.m_ui.loadtipBig.getComponent(UIOpacity)).to(0.2, { opacity: 0 }).start();
        if (param) {
            this.onReqHistory(param);
        }
        return param
    }

    checkFullCallback() {
        return RecordMgr.getInstance().checkReqFull()
    }

    private onReqHistory(param) {
        EventCenter.getInstance().fire(GameEvent.ui_req_loading_complete, this.node)
        this.scheduleOnce(() => {
            this.fistTip.active = false;
        }, 4);
        let data: RecordListRsp = param.data;
        this.m_ui.lb_record_cnt.getComponent(Label).string = (data && data.count || 0) + "条记录";
        this.m_ui.lb_total_bet.getComponent(Label).string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(data && data.bet || 0);
        this.m_ui.lb_total_profit.getComponent(Label).string = MoneyUtil.currencySymbol() + MoneyUtil.rmbStr(data && data.win || 0);
        this.refreshList(null);
        warn("onReqHistory", data)
        let cnt = data && data.count || 0;
        this.m_ui.lb_tip_none.active = cnt <= 0;
        if (this.m_ui.lb_tip_none.active) {
            this.m_ui["Label-002"].getComponent(Label).string = "投注";
            this.m_ui["Label-003"].getComponent(Label).string = "盈利";
        }
    }

}

const COLOR_G = new Color("#BEBEBE");
const COLOR_W = new Color("#FFFFFF");

class HistoryItem implements IListCell {

    doInit(cellCpn: CpnListCell, listCpn: CpnList): void {
        CocosUtil.addClickEvent(cellCpn.node, function () {
            let info = this.getData();
            UIManager.showView(EViewNames.UIHisDetail, EUILayer.Popup, info);
        }, cellCpn, null, 1.01);
    }

    doUpdate(cellCpn: CpnListCell, listCpn: CpnList, data: any, idx: number): void {
        log("data", data)
        let item = cellCpn.node;
        let info = cellCpn.getData();
        let conts: Node = CocosUtil.findNode(item, "conts");
        
        let layout = conts.getChildByName("layout");
        let otherInfo = layout.getChildByName("other");
        let freeTimes = data.free_round_times ? data.free_round_times : 0;
        let normalTimes = data.normal_round_times ? data.normal_round_times : 0;
        otherInfo.active = !!freeTimes || !!normalTimes;
        otherInfo.getChildByName("free_ra").active = freeTimes > 0;
        otherInfo.getChildByName("continuous").active = !!normalTimes || !!freeTimes;
        if (freeTimes) {
            otherInfo.getChildByName("continuous").getChildByName("num").getComponent(Label).string = normalTimes + " + " + freeTimes;
        } else {
            otherInfo.getChildByName("continuous").getChildByName("num").getComponent(Label).string = normalTimes;
        }
        conts.getChildByName("lb_time").getComponent(Label).string = DateUtil.formatTime1(info.create_timestamp / 1000, 2);
        layout.getChildByName("lb_order").getComponent(Label).string = info.order_id;
        conts.getChildByName("lb_bet").getComponent(Label).string = MoneyUtil.rmbStr(info.bet);
        let profit = parseFloat(info.win_s);
        let lb_profit = conts.getChildByName("lb_profit").getComponent(Label);
        // if (profit > 0) {
        //     lb_profit.color = new Color(255, 255, 255)
        // }
        lb_profit.string = MoneyUtil.rmbStr(info.win);
        lb_profit.color = profit > 0 && COLOR_W || COLOR_G;
        let btn = item.getComponent(Button);
        btn.normalColor = idx % 2 == 0 && color(52, 52, 63, 255) || color(48, 48, 60, 255);
        if (idx == listCpn.dataLen() - 1) {
            // this.reqGet(listCpn)
        }
    }

    // async reqGet(listCpn: CpnList) {
    //     // RecordMgr.getInstance().pullData();
    //     let isEnd = await RecordMgr.getInstance().pullData();
    //     if (isEnd) {
    //         listCpn.getComScrollView().node.emit("loading_action_complete")
    //     }else{
    //         listCpn.getComScrollView().node.emit("loading_action")
    //     }
    // }

    onSelect(cellCpn: CpnListCell, listCpn: CpnList, bSelected: boolean): void {

    }

}
