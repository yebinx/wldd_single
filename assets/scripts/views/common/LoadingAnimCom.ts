import { _decorator, Component, isValid, Node } from 'cc';
import GameEvent from '../../event/GameEvent';
import EventCenter from '../../kernel/core/event/EventCenter';
const { ccclass, property } = _decorator;

@ccclass('LoadingAnimCom')
export class LoadingAnimCom extends Component {
    @property(Node)
    bindLloading: Node

    lifeTime: number = 5;


    onLoad() {
        EventCenter.getInstance().listen(GameEvent.ui_req_loading_complete, this.onReqCompelet, this);
        this.scheduleOnce(() => {
            isValid(this.bindLloading) && this.bindLloading.destroy()
        }, this.lifeTime)
    }

    onReqCompelet(bindView: Node) {
        if (this.bindLloading && this.bindLloading.isValid) {
            if (bindView == this.node) {
                isValid(this.bindLloading) && this.bindLloading.destroy()
            }
        }
    }
}


