import { _decorator, color, Component, easing, error, instantiate, Label, log, Node, Prefab, Tween, tween, UIOpacity, UITransform, v3, warn, Widget } from 'cc';
import { EViewNames } from '../../configs/UIConfig';
import GameEvent from '../../event/GameEvent';
import CocosUtil from '../../kernel/compat/CocosUtil';
import { BaseComp } from '../../kernel/compat/view/BaseComp';
import { UIManager } from '../../kernel/compat/view/UImanager';
import CHandler from '../../kernel/core/datastruct/CHandler';
import EventCenter from '../../kernel/core/event/EventCenter';
import MathUtil from '../../kernel/core/utils/MathUtil';
import MoneyUtil from '../../kernel/core/utils/MoneyUtil';
import RecordMgr from '../../mgrs/RecordMgr';
import { CompHisPage } from './CompHisPage';
import Routes from '../../define/Routes';
import { RecordDetailInfo, RecordDetailRsp, RoundDetailInfo } from '../../interface/recorddetail';
import { ServerResult } from '../../interface/common';
import { UIDetailTip } from './UIDetailTip';
import { PopupView } from '../../kernel/compat/view/PopupView';
import { UIActionEx } from '../common/UIActionEx';



const { ccclass, property } = _decorator;


@ccclass('UIHisDetail')
export class UIHisDetail extends PopupView {
    private _ddIndex: number = 0;
    @property(Prefab)
    prfPage: Prefab;
    private _param;

    private _curIdx: number = 0;
    private _detailData: RoundDetailInfo[] = null;
    private _data: RecordDetailInfo[] = null;
    private _expanded: boolean = false;

    private curcloneTip: Node;

    private _beforeData: any = null;

    pages: Node[] = [];

    _initedFL: boolean = false;

    private setExpanded(bExp: boolean) {
        this._expanded = bExp;
        this.m_ui.expand_arrow.scale = v3(1, bExp && -1 || 1, 1)
        if (bExp) {
            this.m_ui.pan_frees.active = bExp;
            tween(this.m_ui.pan_frees)
                .to(0.4, { position: v3(0, -64, 0) })
                .start()
            this.initFreeList()
            this.highSelect();
        } else {
            tween(this.m_ui.pan_frees)
                .to(0.4, { position: v3(0, 1574, 0) })
                .call(() => {
                    this.m_ui.pan_frees.active = bExp;
                })
                .start()
        }
    }

    private highSelect() {
        for (let i = 0; i < this.m_ui.cont_frees.children.length; i++) {
            let ddd = this.m_ui.cont_frees.children[i];
            if (i == this._curIdx) {
                ddd.getChildByName("lb_free_rmn").getComponent(Label).color = color("#6EE78D");
                ddd.getChildByName("lb_free_gld").getComponent(Label).color = color("#6EE78D");
            } else {
                ddd.getChildByName("lb_free_rmn").getComponent(Label).color = color(255, 255, 255, 255);
                ddd.getChildByName("lb_free_gld").getComponent(Label).color = color(255, 255, 255, 255);
            }
        }
    }

    initData(data) {
        log("详情数据", data);
        this._data = data;
    }

    protected onLoad(): void {
        CocosUtil.traverseNodes(this.node, this.m_ui);
        this.m_ui.btn_pre.active = false;
        this.m_ui.btn_next.active = false;
        this.setExpanded(false);
        this.m_ui.aniRoot.getComponent(UIOpacity).opacity = 1;

        tween(this.node).delay(0.5).call(() => {
            UIManager.getView(EViewNames.UIhistory).active = false;
        }).start();
    }

    waitAnim(isTransparent: boolean) {
        return new Promise<void>((resolve, reject) => {
            this.m_ui.loadtip.active = true;
            let op = this.m_ui.loadtip.getComponent(UIOpacity);
            Tween.stopAllByTarget(op);
            op.opacity = 255;
            if (!isTransparent) {
                tween(op).delay(0.5).call(() => {
                    resolve();
                }).start();
            } else {
                tween(op).to(0.2, { opacity: 0 }).call(() => {
                    resolve();
                }).start();
            }
        })
    }

    start() {
        this.m_ui.detailBG.on(Node.EventType.TOUCH_END, () => {
            this.m_ui.detailBG.active = false;
            if (this.curcloneTip && this.curcloneTip.isValid) {
                this.curcloneTip.destroy()
                this.curcloneTip = null;
            }
        })
        CocosUtil.addClickEvent(this.m_ui.btn_close, function () {
            // let bg = this.node.getChildByName("bg");
            // tween(bg).to(0.3, { position: v3(756, 0, 0) })
            //     .call(() => {
            //     })
            //     .start();
            Tween.stopAllByTarget(this.node);
            UIManager.getView(EViewNames.UIhistory).active = true;
            UIManager.closeView(EViewNames.UIHisDetail);
        }, this);

        CocosUtil.addClickEvent(this.m_ui.btn_pre, () => {
            let idx = this._ddIndex
            idx--;
            if (idx < 0) {
                idx = 0
            }
            this.turnPage(idx)
        }, this);

        CocosUtil.addClickEvent(this.m_ui.btn_next, () => {
            let idx = this._ddIndex
            idx++;
            let len = this.getTotalNum();
            if (idx > len - 1) {
                idx = len - 1;
            }
            this.turnPage(idx)
        }, this);

        CocosUtil.addClickEvent(this.m_ui.btn_expand, () => {
            if (this._data.length <= 1) {
                return;
            }
            this.setExpanded(!this._expanded);
        }, this);

        CocosUtil.addClickEvent(this.m_ui.btnClosePanFree, () => {
            this.setExpanded(false);
        }, this);

        CocosUtil.addClickEvent(this.m_ui.retry, async() => {
            this.m_ui.load_err.active = false;
            this.isAnim = false;
            await this.waitAnim(false);
            this.before(this._beforeData);
        }, this);

        CocosUtil.addClickEvent(this.m_ui.err_close, () => {
            Tween.stopAllByTarget(this.node);
            UIManager.getView(EViewNames.UIhistory).active = true;
            UIManager.closeView(EViewNames.UIHisDetail);
        }, this);

        // EventCenter.getInstance().listen(Routes.req_hisdetail, (info: ServerResult<RecordDetailRsp>) => {
        //     this.onDetailData(info.data.list[0]);
        // }, this);
        EventCenter.getInstance().listen(GameEvent.ui_show_hisdetail_tip, this.onShowDetailTip, this);
        this.scheduleOnce(() => {
            this.m_ui.aniRoot.getComponent(UIOpacity).opacity = 255;
        });
    }

    async before(data) {
        warn("before", data)
        this._beforeData = data;
        this.waitAnim(false);
        let datas = await Promise.all([
            new Promise(async res => {
                if (this.isAnim) {
                    // CocosUtil.traverseNodes(this.node, this.m_ui)
                    let aniRoot = this.m_ui.aniRoot
                    if (aniRoot) {
                        await UIActionEx.runAction(aniRoot, this.uiOpenAction)
                        res(null)
                    }
                } else {
                    res(null)
                }
            }),
            RecordMgr.getInstance().pullDetail(data.order_id)
        ])
        if (!datas[1]) {
            this.m_ui.load_err.active = true;
            return;
        }
        this.onDetailData(datas[1] as any);
        EventCenter.getInstance().fire(GameEvent.ui_req_loading_complete, this.node)
    }

    private onShowDetailTip(uiNode: Node, info: { dataArr: string[], item: Node }) {
        if (this.curcloneTip && this.curcloneTip.isValid || !info) {
            return;
        }
        this.m_ui.detailBG.active = true;
        let cloneTip = instantiate(this.m_ui.detailBG.getChildByName("UIDetailTip"))
        cloneTip.active = true;
        this.curcloneTip = cloneTip;
        cloneTip.getComponent(UIDetailTip).initData(info)
        uiNode.addChild(cloneTip)
    }

    private onDetailData(detailInfo?: RecordDetailInfo[]) {
        this._curIdx = 0;
        this._data = detailInfo
        this._detailData = this._data[this._curIdx].round_list;
        if (!this._detailData) {
            return;
        }
        log("-----detail", this._data[this._curIdx].create_time);
        let curData = this._detailData[this._ddIndex];
        if (!curData) {
            return
        }
        this.m_ui.expand_arrow.active = this._data.length > 1;
        let tstr = this._data[this._curIdx].create_time.substring(0, this._data[this._curIdx].create_time.length - 3) + " (GMT+8:00)";
        this.m_ui.lb_title_filter.getComponent(Label).string = tstr.replace(/-/g, "/");
        this.initPages();
        this.selectPage(this._curIdx);
    }

    private initPages() {
        let content = this.m_ui.pages;
        // let dataArr = this._detailData;
        this.pages.forEach(v => v.destroy())
        this.pages.length = 0;
        let len = this.getTotalNum();
        warn("initPages", len);
        for (let i = 0; i < len; i++) {
            let one = instantiate(this.prfPage);
            content.addChild(one);
            one.setPosition(756 * i, 0, 0);
            one.active = i == 0;
            this.pages[i] = one;
            this.refreshPageData(i);
        }
        this.waitAnim(true);
    }

    private getTotalNum() {
        let len = 0;
        this._data.forEach((detail) => {
            len += detail.round_list.length;
        });
        return len;
    }

    private findCurIdx(pageIdx: number) {
        let len = 0;
        for (let i = 0; i < this._data.length; i++) {
            let ele = this._data[i];
            let nextLen = len + ele.round_list.length;
            if (pageIdx < nextLen) {
                return i;
            }
            len = nextLen;
        }
        return this._data.length - 1;
    }

    private initFreeList() {
        if (this._initedFL) { return; }
        this._initedFL = true;
        let total = this._data.length - 1;
        for (let i = 0; i < this._data.length; i++) {
            let ddd = this.m_ui.cont_frees.children[i];
            let gold = 0;
            if (!ddd) {
                ddd = instantiate(this.m_ui.cont_frees.children[0]);
                ddd.parent = this.m_ui.cont_frees;
                ddd.getChildByName("lb_free_rmn").getComponent(Label).string = "免费旋转: " + i + "/" + total;
                gold = MoneyUtil.rmbYuan(this._data[i].prize);
            } else {
                ddd.getChildByName("lb_free_rmn").getComponent(Label).string = "普通旋转";
                gold = MoneyUtil.rmbYuan(this._data[i].player_win_lose);
            }
            let fuhao = gold < 0 ? "-" : "";
            ddd.getChildByName("lb_free_gld").getComponent(Label).string = fuhao + "¥" + MoneyUtil.formatGold(Math.abs(gold));

            CocosUtil.addClickEvent(ddd, () => {
                this.selectPage(i);
                // this._curIdx = idx;
                // this.onDetailData(this._data);
                this.setExpanded(false);
                this.highSelect();
            }, this, i, 0.96);
        }
    }

    setTitleName() {
        warn("setTitleName", this._curIdx);
        let curDetailData = this._data[this._curIdx];
        if (curDetailData) {
            let len = this._data.length - 1;
            let curIdx = this._curIdx
            if (this._curIdx == 0) {
                this.m_ui.lb_title.getComponent(Label).string = "普通旋转";
            } else {
                this.m_ui.lb_title.getComponent(Label).string = "免费旋转: " + curIdx + "/" + len;
            }
        }
    }

    private refreshPageData(pageIdx: number) {
        // warn("refreshPageData", pageIdx, this._detailData);
        // if (!this._detailData) { return; }
        let msg = this.getDetailData(pageIdx);
        warn("refreshPageData", msg.data, this._curIdx);
        this.pages[pageIdx].getComponent(CompHisPage).setData(msg.data, msg.isFree, msg.hasNext);
    }

    private getDetailData(pageIdx: number) {
        let len = 0;
        for (let i = 0; i < this._data.length; i++) {
            let ele = this._data[i];
            let nextLen = len + ele.round_list.length;
            if (pageIdx < nextLen) {
                return { data: ele.round_list[pageIdx - len], isFree: ele.free_total_times != ele.free_remain_times, hasNext: ele.round_list.length != 0 };
            }
            len = nextLen;
        }
    }

    private turnPage(nextIdx: number) {
        let curIdx = this._ddIndex;
        this.pages.forEach(v => {
            Tween.stopAllByTarget(v);
            v.active = false
        })
        warn("turnPage", this.pages.length, curIdx, nextIdx)
        let curPage = this.pages[curIdx];
        let nextPage = this.pages[nextIdx];
        curPage.active = true
        nextPage.active = true
        let width = curPage.getComponent(UITransform).contentSize.width;
        if (nextIdx > curIdx) {
            curPage.setPosition(0, curPage.position.y, curPage.position.z);
            nextPage.setPosition(width, nextPage.position.y, nextPage.position.z);
            tween(curPage).by(0.4, { position: v3(-width, 0, 0) }, { easing: easing.cubicOut }).start();
            tween(nextPage).by(0.4, { position: v3(-width, 0, 0) }, { easing: easing.cubicOut }).start();
        } else {
            curPage.setPosition(0, curPage.position.y, curPage.position.z);
            nextPage.setPosition(-width, nextPage.position.y, nextPage.position.z);
            tween(curPage).by(0.4, { position: v3(width, 0, 0) }, { easing: easing.cubicOut }).start();
            tween(nextPage).by(0.4, { position: v3(width, 0, 0) }, { easing: easing.cubicOut }).start();
        }
        this._ddIndex = nextIdx;
        this.m_ui.btn_pre.active = this._ddIndex != 0;
        this.m_ui.btn_next.active = this._ddIndex != this.getTotalNum() - 1;
        this._curIdx = this.findCurIdx(this._ddIndex);
        this.setTitleName()
    }

    findIndexZore(curIdx: number) {
        let len = 0;
        for (let i = 0; i < this._data.length; i++) {
            let ele = this._data[i];
            if (i == curIdx) {
                break;
            }
            len += ele.round_list.length;
        }
        return len;
    }

    private selectPage(curIdx: number) {
        this._ddIndex = this.findIndexZore(curIdx);
        warn("selectPage", this._ddIndex, curIdx);
        let page = this.pages[this._ddIndex];
        if (!page) {
            return;
        }
        this.pages.forEach(v => {
            Tween.stopAllByTarget(v);
            v.active = false
        })
        page.active = true;
        this._curIdx = curIdx;
        this.m_ui.btn_pre.active = this._ddIndex != 0;
        this.m_ui.btn_next.active = this._ddIndex != this.getTotalNum() - 1;
        warn("总页数", this.getTotalNum() - 1, this._ddIndex)
        page.position = page.position.set(0, page.position.y, page.position.z);
        this.setTitleName()
    }
}


