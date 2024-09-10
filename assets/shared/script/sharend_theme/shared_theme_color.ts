import { _decorator, Color, Component, log, Node, UIRenderer } from 'cc';
import { SharedConfig } from '../config/shared_config';
const { ccclass, property } = _decorator;

// 把节点更新成主题颜色

@ccclass('SharedThemeColor')
export class SharedThemeColor extends Component {
    @property({ type: UIRenderer, displayName: "修改成主题的颜色" })
    rendererList: UIRenderer[] = []

    protected onLoad(): void {
        log("修改主题颜色", SharedConfig.THEME_COLOR);
        this.rendererList.forEach((render: UIRenderer) => {
            render.color = SharedConfig.THEME_COLOR.clone();
        })
    }

    protected start(): void {
        this.destroy();
    }
}


