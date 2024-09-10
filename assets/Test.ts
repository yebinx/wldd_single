import { _decorator, Component, Node, sp, warn } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Test')
export class Test extends Component {

    @property(sp.Skeleton)
    spHuzi: sp.Skeleton = null;

    async start() {
        // let sps = this.node.getComponent(sp.Skeleton);
        // let anim = ["win_big_in1", "win_big_in2", "win_big_in3",
        //     "win_huge_in1", "win_huge_in2", "win_huge_in33",
        //     "win_super_in1", "win_super_in2", "win_super_in33"];
        // let idx = 0;
        // let temp = [];
        // while (idx < anim.length) {
        //     sps.setAnimation(0, anim[idx], false);
        //     temp.push({name: anim[idx], time: sps.getCurrent(0).animationEnd})
        //     idx++;
        //     await this.waitTime();
        // }
        // warn("temp", JSON.stringify(temp))

        this.spHuzi.setCompleteListener((t) => {
            let aniName = t.animation.name;
            switch (aniName) {
                case "win_big_in1":
                    this.spHuzi.setAnimation(0, "win_big_in2", false)
                    break;
                case "win_big_in2":
                    // this.spHuzi.setAnimation(0, "win_big_in3", false)
                    break;
                case "win_big_in3":
                    break;
                case "win_huge_in1":
                    this.spHuzi.setAnimation(0, "win_huge_in2", false)
                    break;
                case "win_huge_in2":
                    // this.spHuzi.setAnimation(0, "win_huge_in33", false)
                    break;
                case "win_huge_in33":
                    break;
                case "win_super_in1":
                    this.spHuzi.setAnimation(0, "win_super_in2", false)
                    break;
                case "win_super_in2":
                    // this.spHuzi.setAnimation(0, "win_super_in33", false)
                    break;
                case "win_super_in33":
                    break;
            }
        })

        this.scheduleOnce(() => {
            this.spHuzi.setAnimation(0, "win_super_in1", false)
        }, 1);
    }
    
    waitTime() {
        return new Promise<void>((resolve, reject) => {
            this.scheduleOnce(() => {
                resolve()
            }, 0.1)
        })
    }

    update(deltaTime: number) {

    }
}