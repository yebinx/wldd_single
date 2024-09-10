import { TRound } from "../interface/result";

export default class UserInfo{
    public player_info;
    public game_info;
    public list?: { item_type_list: number[] }[];
    public lastRound?: { free_play: number, origin_rate: number, rate: number, round_list?: TRound[], is_end_free?: boolean };
    constructor(){
        this.player_info={
            "id": 4598,
            "balance": 100000000,
            "account": "try_hkEpOe7PdBscqJsr",
            "nickname": "试玩ImJIH50MoT",
            "type": 0,
            "mute": 0
        }

        this.game_info={
            "id": 4598,
            "free_play_times": 0,
            "last_time_bet": 0,
            "last_time_bet_id": 0,
            "last_time_bet_size": 0,
            "last_time_basic_bet": 0,
            "last_time_bet_multiple": 0,
            "free_total_times": 0,
            "free_remain_times": 0,
            "free_game_total_win": 0,
            "total_bet": 0,
            "total_bet_times": 0,
            "total_free_times": 0,
            "last_win": 0
        }

        this.list=[
            {
                "item_type_list": [
                    5,
                    9,
                    10,
                    6,
                    11
                ]
            },
            {
                "item_type_list": [
                    3,
                    20,
                    2,
                    7,
                    4
                ]
            },
            {
                "item_type_list": [
                    1,
                    9,
                    5,
                    1,
                    10
                ]
            },
            {
                "item_type_list": [
                    3,
                    2,
                    20,
                    7,
                    4
                ]
            },
            {
                "item_type_list": [
                    5,
                    9,
                    10,
                    6,
                    11
                ]
            }
        ];

        this.lastRound = null;
    }
}