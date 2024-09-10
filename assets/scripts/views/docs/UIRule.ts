import { _decorator, Component, Node, tween, UIOpacity } from 'cc';
import CocosUtil from '../../kernel/compat/CocosUtil';
import { BaseComp } from '../../kernel/compat/view/BaseComp';
import { UIManager } from '../../kernel/compat/view/UImanager';
import { EViewNames } from '../../configs/UIConfig';
import { PopupView } from '../../kernel/compat/view/PopupView';
const { ccclass, property } = _decorator;

@ccclass('UIRule')
export class UIRule extends PopupView {
    start() {
        CocosUtil.traverseNodes(this.node, this.m_ui)
        CocosUtil.addClickEvent(this.m_ui.btn_close,()=>{
            UIManager.closeView(EViewNames.UIRule)
        },this)

        this.m_ui.btn_close.active = false;
        this.m_ui.loadtip.active = true;
        this.m_ui.ScrollView.active = false;
        this.m_ui.scrollBar.active = false;

        tween(this.m_ui.loadtip.getComponent(UIOpacity)).delay(0.5).to(0.2, { opacity: 0 }).call(() => {
            this.m_ui.btn_close.active = true;
            this.m_ui.loadtip.active = false;
            this.m_ui.ScrollView.active = true;
            this.m_ui.scrollBar.active = true;
        }).start();
    }


}


