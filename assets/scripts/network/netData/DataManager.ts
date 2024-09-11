
import BetInfo from "../../data/BetInfo";
import BetResult from "../../data/BetResult";
import BetResultEle from "../../data/BetResultEle";
import CardListEle from "../../data/CardListEle";
import UserInfo from "../../data/UserInfo";
import GameConst, { TItemtype } from "../../define/GameConst";
import { BetRsp } from "../../interface/bet";
import { BetInfoRsp } from "../../interface/betinfo";
import { TResult, TRound } from "../../interface/result";
import EventCenter from "../../kernel/core/event/EventCenter";
import MoneyUtil from "../../kernel/core/utils/MoneyUtil";


export default class DataManager{
    public static gametoken:string="";
    public static userId:number=0;
    public static serverTypeStr="";
    public static totalRoomInitCost:number=0;
    public static tagUserInfoHead=null;
    public static CMD_S_StatusFree=null;
    public static CMD_GR_ServerInfoV2=null;
    public static betCfg=null;
    public static currBet:number=0;
    public static preTotalFree:number=0;
    public static balance = 0;
    private static lastRound=null;
    public static getCmdEventName(mainCmdID, SubCmdID, serverTypeStr=null) {
        let tserverTypeStr = serverTypeStr?serverTypeStr:this.serverTypeStr;
        return tserverTypeStr + "_" + "CMD_" + mainCmdID + "_" + SubCmdID;
    };

   
    public static betResult:BetResult=null;
   public static norBetResp(CMD_S_GameEnd){
       if(!this.betResult)this.betResult=new BetResult(CMD_S_GameEnd);
       else this.betResult.addRound(CMD_S_GameEnd);
       
   }

   public static betResultComplete(){
        //this.betResult.norData();
        let tdata = this.getResultData();
        EventCenter.getInstance().fire("betResp",tdata)
        console.log("betResultComplete",this.betResult,tdata);
        this.lastRound = tdata.result.round_list[tdata.result.round_list.length-1];
        this.balance = tdata.balance;
        //this.clearClassData();
   }

   private static getResultData(){
        let tdata:BetRsp = new BetRsp();
        tdata.balance = this.betResult.balance;
        tdata.balance_s =  MoneyUtil.formatGold(this.betResult.balance);
        tdata.bet = this.currBet;
        tdata.bet_s =  MoneyUtil.formatGold(this.currBet);
        tdata.free_remain_times = this.betResult.freeCount;
        tdata.prize = this.betResult.haveWin;
        tdata.prize_s = MoneyUtil.formatGold(this.betResult.haveWin);
        tdata.player_win_lose = this.betResult.haveWin?this.betResult.haveWin:-this.currBet;
        tdata.player_win_lose_s = MoneyUtil.formatGold(this.betResult.haveWin?this.betResult.haveWin:-this.currBet);
        tdata.result = new TResult();
        tdata.result.rate=GameConst.BeseGold;
        tdata.result.free_play = this.betResult.triFreeCount;
        tdata.result.is_end_free = this.betResult.freeCount==0 && this.preTotalFree>0;
        tdata.free=this.betResult.triFreeCount>0;
        tdata.free_total_times = this.betResult.totalFreeCount?this.betResult.totalFreeCount:this.preTotalFree;
        tdata.trigger_free = this.betResult.triFreeCount>0 && this.preTotalFree>0;
        tdata.free_game_total_win=this.betResult.nFreeTotalAwardGold;
        tdata.free_game_total_win_s=MoneyUtil.formatGold(this.betResult.nFreeTotalAwardGold);
        for(let i=0;i<this.betResult.result.length;i++){
            let ttemp = this.betResult.result[i];
            let tround:TRound = {};
            tround.balance = ttemp.balance;
            tround.balance_s = MoneyUtil.formatGold(ttemp.balance);
            tround.win = ttemp.win;
            tround.win_s = MoneyUtil.formatGold(ttemp.win);
            tround.free_play = ttemp.triFreeCount;
            tround.multi_time=ttemp.multiple;
            tround.item_type_list=[];
            tround.next_list=[];
            tround.col_symbol_list=[];
            tround.win_pos_list=[];
            tround.drop_list=[];
            tround.prize_list=[];
            tround.dyadic_list=[];
            let tmaxLen=3;
            for(let col=0;col<5;col++){
                let tcollist = ttemp.card_list[col];
                let col_symbol_listEle={list:[]};
                
                for(let row=tmaxLen;row>=0;row--){
                    tround.item_type_list.push(tcollist.list[row]);
                    col_symbol_listEle.list.push(tcollist.list[row]);
                   
                }
                tround.col_symbol_list.push(col_symbol_listEle);
            }
           
            tdata.result.round_list.push(tround);
        }
        this.initNextEle(tdata.result.round_list);
        this.initNext(tdata.result.round_list);
        return tdata;
   }

   private static initNext(results){
        for(let i=0;i<results.length;i++){
            let tround:TRound = results[i];
            let ttemp = this.betResult.result[i];
            for(let col=0;col<5;col++){
                let tcollist = ttemp.card_list[col];
                let tremovelen = tcollist.removeList.length;
                let tdyadic:any={list:null}
                if(tremovelen>0){
                    let tnext = results[i+1];
                    let tnextList = tnext.col_symbol_list[col].list;
                    tdyadic.list=[];
                    for(let row=0;row<tremovelen;row++){
                        tdyadic.list.push(tnextList[row]);
                    }
                    tdyadic.list.push(tnext.next_list[col]);
                }
                for(let j=0;j<tcollist.winpos.length;j++){
                    let tpos = col*4+(3-tcollist.winpos[j]);
                    tround.win_pos_list.push(tpos);
                    //console.log("aaaaaa",i,col,j);
                }
                tround.dyadic_list.push(tdyadic);
            }
           
            tround.prize_list = this.getPrizeList(tround.item_type_list,tround.win_pos_list.slice());
        }
   }

   private static initNextEle(results){
       for(let i=0;i<results.length;i++){
           let tround:TRound = results[i];
           for(let col=0;col<5;col++){
                tround.next_list[col] = this.getNextColEle(results,tround,col,i);
           }
       }
   }

   private static getNextColEle(results,round,col,index){
        let tele = 4;
        let tindex = index+1;
        let tnext = results[tindex];
        if(tnext){
            let ttemp = this.betResult.result[index];
           let tcollist = ttemp.card_list[col];
            let tremovelen = tcollist.removeList.length;
           if(tremovelen>0){
                tele = tnext.col_symbol_list[col].list[tremovelen-1];
           }else{
                let ttemp = this.betResult.result[tindex];
                let tcollist = ttemp.card_list[col];
                let tremovelen = tcollist.removeList.length;
                if(tremovelen>0){
                    let tnextnext = results[tindex+1];
                    tele = tnextnext.col_symbol_list[col].list[tremovelen-1]; 
                }else{
                    return this.getNextColEle(results,round,col,tindex);
                }
           }
        }
        return tele;
   }

   private static getPrizeList(cardList,winPos){
        //console.log("getPrizeList",winPos.slice());
        let ttar=[];
        let tids=[];
        for(let i=0;i<winPos.length;i++){
            let tid = cardList[winPos[i]];
            if(tid==TItemtype.ITEM_TYPE_WILD || tid>11)continue;
            if(tids.indexOf(tid)<0)tids.push(tid);
        }
        
        for(let i=0;i<tids.length;i++){
            let tdata = {win_pos_list:[],count:0,level:0,item_type:tids[i],rate:1,win:0,win_s:MoneyUtil.formatGold(0)};
            for(let j=0;j<winPos.length;j++){
                if(this.isSameId(tids[i],cardList[winPos[j]]) || cardList[winPos[j]]==TItemtype.ITEM_TYPE_WILD){
                    tdata.win_pos_list.push(winPos[j]);
                }
                console.log("getPrizeList",winPos[j],tids[i],cardList[winPos[j]],this.isSameId(tids[i],cardList[winPos[j]]));
            }
            ttar.push(tdata);
        }
        return ttar;
   }

   public static isSameId(id1:number,id2:number){
        if(id1==id2)return true;
        if(id1<=11){
            if(id1 == id2-16)return true;
        }else if(id1-16 == id2)return true;
        return false;
   }

//    private static getLastEle(listEle:CardListEle,index,col){
//         let tindex = index+1;
//         let tnext:BetResultEle = this.betResult[tindex];
//         if(tnext){
//             let tremovelen = listEle.removeList.length;
//             if(tremovelen>0){
//                 let trow = tremovelen%listEle.list.length;
//                 let tele = tnext.card_list[col].list[]
//                 return;
//             }else{
//                 let tnextnext:BetResultEle = this.betResult[tindex+1];
//                 if(tnextnext.card_list[col].removeList.length){
//                     return;
//                 }
//                 return this.getLastEle(listEle,tindex,col);
//             }
//         }
//         return 3;
//    }

   public static clearClassData(){
        if(this.betResult)this.preTotalFree = this.betResult.totalFreeCount;
        this.betResult=null;
    }

    public static convertToNorId(id:number){
        let tid = id+2;
        if(id==10)tid=1;
        else if(id==12)tid=2;
        return tid;
    }
   /**
    * 转换成本客户端id 因为接的另外的服务端需要转换一下id
    * 
    * id接收到的服务的id
   */
   public static convertId(id:number,frameType:number=0,row:number=1){
        let tid = id+2;
        if(id==10)tid=1;
        else if(id==12)tid=2;
        let tarid = tid;
        if(frameType==1 && tid>2)tarid = tid+16;
        return tarid;
   }

   public static encodeItemType(itemType: number,frameType,space=1){
        // 确保 space 是有效值，如果 space 为 1，则设置为 0（因为 decodeItemType 中有类似的逻辑）
        if (space == 1) {
            space = 0;
        }

        // 计算原始的 _itemType 值
        let _itemType = itemType//(frameType * IconFrame.SILVERFRAME) + (space * IconGrid.SPACEBASE) + itemType;

        return _itemType;
    }

   public static initLoginData(){
        let tuserinfo:UserInfo = new UserInfo();
        if(this.tagUserInfoHead){
            tuserinfo.player_info.id=this.tagUserInfoHead.dwUserID.value;
            tuserinfo.player_info.balance = this.tagUserInfoHead.userScoreInfo.lGoldTotal.value;
            //tuserinfo.player_info.nickname = this.tagUserInfoHead
            this.balance = tuserinfo.player_info.balance;
        }
        return tuserinfo;
   }

   private static max_bet_multiple=10;
   public static initBetInfo(){
        let tdata = {bet_list:[],default_id:10,addSubCombination:[
            1,
            2,
            3,
            11,
            5,
            10,
            15,
            20,
            31,
            30,
            35,
            40
        ]};
        
        let tbetinfo:BetInfoRsp = tdata as BetInfoRsp;
        let tbasic_bet = 20;
        let tid=1;
        if(this.betCfg){
            tbetinfo.addSubCombination=[];
            for(let i=0;i<this.betCfg.length;i++){
                for(let multiple=1;multiple<=10;multiple++){
                    let tbetsize = this.betCfg[i]*GameConst.BeseGold;
                    let ttoal = tbetsize*tbasic_bet*multiple;
                    tbetinfo.bet_list.push({bet_size:tbetsize,bet_multiple:multiple,basic_bet:tbasic_bet,total_bet:ttoal,id:tid,bet_size_s:this.formatGold(tbetsize),total_bet_s:this.formatGold(ttoal)});
                    tbetinfo.addSubCombination.push(tid);
                    tid++;
                }
            }
        }
        return tbetinfo;
   }

   public static getL10n(key: string) {
        // l10n的子包加载有时候会比resources慢
        if (window["l10n"]) {
            return window["l10n"].t(key);
        }

        return key;
    }

    private static formatGold(value:number){
        let tmoney = MoneyUtil.rmbYuan(value);
        let tstr = MoneyUtil.formatGold(tmoney);
        return tstr;
    }

    public static getTestBetData(){
        let info = {
            "error_code": 0,
            "data": {
                "result": {
                    "round_list": [
                        {
                            "item_type_list": [
                                8,
                                7,
                                9,
                                5,
                                22,
                                24,
                                7,
                                4,
                                27,
                                26,
                                22,
                                26,
                                24,
                                2,
                                5,
                                8,
                                11,
                                4,
                                4,
                                9
                            ],
                            "round_rate": 0,
                            "round": 1,
                            "multi_time": 1,
                            "prize_list": null,
                            "next_list": [
                                6,
                                6,
                                20,
                                4,
                                2
                            ],
                            "list": null,
                            "win_pos_list": null,
                            "dyadic_list": null,
                            "round_id": "2747320439",
                            "gold_change_list": null,
                            "col_symbol_list": [
                                {
                                    "list": [
                                        8,
                                        7,
                                        9,
                                        5
                                    ]
                                },
                                {
                                    "list": [
                                        22,
                                        24,
                                        7,
                                        4
                                    ]
                                },
                                {
                                    "list": [
                                        27,
                                        26,
                                        22,
                                        26
                                    ]
                                },
                                {
                                    "list": [
                                        24,
                                        2,
                                        5,
                                        8
                                    ]
                                },
                                {
                                    "list": [
                                        11,
                                        4,
                                        4,
                                        9
                                    ]
                                }
                            ],
                            "win_symbol_point": null,
                            "origin_round_rate": 0,
                            "free_play": 0,
                            "balance": 99964000,
                            "balance_s": "9996.40",
                            "win_s": "0.00",
                            "win": 0,
                            "player_win_lose_s": ""
                        }
                    ],
                    "rate": 0,
                    "scatter_count": 1,
                    "free_play": 0,
                    "scatter_symbol_point": null,
                    "origin_rate": 0,
                    "is_end_free": false
                },
                "round_no": "11-1705455494-YUATYZUK",
                "order_id": "11-1705455475-EUP0HRZ9",
                "balance": 99964000,
                "balance_before_score": 99964000,
                "bet": 60000,
                "prize": 0,
                "player_win_lose": 0,
                "trigger_free": false,
                "free_total_times": 12,
                "free_remain_times": 10,
                "free_game_total_win": 0,
                "dbg": [
                    "玩家本输赢=0.00",
                    "倍率=0"
                ]
            },
            "req": {
                "token": "DFECD631A01B49FD88E5A91AB9F655D4",
                "idempotent": "1705455498555"
            }
        }
        let tresult:any = info.data;
        if(this.lastRound)tresult.result.round_list[0]=this.lastRound;
        tresult.balance  = this.tagUserInfoHead.userScoreInfo.lGoldTotal.value;
        tresult.result.round_list[0].balance = this.tagUserInfoHead.userScoreInfo.lGoldTotal.value;
        return tresult;
    }

    public static isWild(id){
        return id==10;
    }
}