import { log, warn } from "cc";
import Routes from "../define/Routes";
import EventCenter from "../kernel/core/event/EventCenter";
import logger from "../kernel/core/logger";
import HttpUtil from "../kernel/core/net/HttpUtil";
import { EHttpResult } from "../kernel/core/net/NetDefine";
import Singleton from "../kernel/core/utils/Singleton";
import StringUtil from "../kernel/core/utils/StringUtil";
import LoginCtrl from "../ctrls/LoginCtrl";

export default class HttpMgr extends Singleton {
	_domain = "http://8.212.1.184:10011"

	_hidePrints = {
		[Routes.req_heartbeat]: true
	}

	setDomain(url: string) {
		if (url === undefined || url === null || url == "" ||
			url.indexOf("localhost") == -1 || url.indexOf("http://127.0.0.1/") == -1) {
			return;
		}
		if (url.lastIndexOf("/") == url.length - 1) {
			url = url.substring(0, url.length - 1);
		}
	}

	norCount = 0
	freeCount = 0


	post(route: string, data: any, callback?: (bSucc: boolean, data: any) => void) {
		let dataStr = JSON.stringify(data)

		if (LoginCtrl.getIns().isTest) {
			let info: any


			if (route == Routes.req_login) {

				info = {
					"error_code": 0,
					"data": {
						"player_info": {
							"id": 4598,
							"balance": 100000000,
							"account": "try_hkEpOe7PdBscqJsr",
							"nickname": "试玩ImJIH50MoT",
							"type": 0,
							"mute": 0
						},
						"game_info": {
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
						},
						"list": [
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
						],
						"lastRound": null
					},
					"req": {
						"token": "DFECD631A01B49FD88E5A91AB9F655D4"
					}
				}

			} else if (route == Routes.req_bet_info) {

				info = {
					"error_code": 0,
					"data": {
						"bet_list": [
							{
								"bet_size": 300,
								"bet_multiple": 1,
								"basic_bet": 20,
								"total_bet": 6000,
								"id": 1,
								"bet_size_s": "0.03",
								"total_bet_s": "0.60"
							},
							{
								"bet_size": 300,
								"bet_multiple": 2,
								"basic_bet": 20,
								"total_bet": 12000,
								"id": 2,
								"bet_size_s": "0.03",
								"total_bet_s": "1.20"
							},
							{
								"bet_size": 300,
								"bet_multiple": 3,
								"basic_bet": 20,
								"total_bet": 18000,
								"id": 3,
								"bet_size_s": "0.03",
								"total_bet_s": "1.80"
							},
							{
								"bet_size": 300,
								"bet_multiple": 4,
								"basic_bet": 20,
								"total_bet": 24000,
								"id": 4,
								"bet_size_s": "0.03",
								"total_bet_s": "2.40"
							},
							{
								"bet_size": 300,
								"bet_multiple": 5,
								"basic_bet": 20,
								"total_bet": 30000,
								"id": 5,
								"bet_size_s": "0.03",
								"total_bet_s": "3.00"
							},
							{
								"bet_size": 300,
								"bet_multiple": 6,
								"basic_bet": 20,
								"total_bet": 36000,
								"id": 6,
								"bet_size_s": "0.03",
								"total_bet_s": "3.60"
							},
							{
								"bet_size": 300,
								"bet_multiple": 7,
								"basic_bet": 20,
								"total_bet": 42000,
								"id": 7,
								"bet_size_s": "0.03",
								"total_bet_s": "4.20"
							},
							{
								"bet_size": 300,
								"bet_multiple": 8,
								"basic_bet": 20,
								"total_bet": 48000,
								"id": 8,
								"bet_size_s": "0.03",
								"total_bet_s": "4.80"
							},
							{
								"bet_size": 300,
								"bet_multiple": 9,
								"basic_bet": 20,
								"total_bet": 54000,
								"id": 9,
								"bet_size_s": "0.03",
								"total_bet_s": "5.40"
							},
							{
								"bet_size": 300,
								"bet_multiple": 10,
								"basic_bet": 20,
								"total_bet": 60000,
								"id": 10,
								"bet_size_s": "0.03",
								"total_bet_s": "6.00"
							},
							{
								"bet_size": 1000,
								"bet_multiple": 1,
								"basic_bet": 20,
								"total_bet": 20000,
								"id": 11,
								"bet_size_s": "0.10",
								"total_bet_s": "2.00"
							},
							{
								"bet_size": 1000,
								"bet_multiple": 2,
								"basic_bet": 20,
								"total_bet": 40000,
								"id": 12,
								"bet_size_s": "0.10",
								"total_bet_s": "4.00"
							},
							{
								"bet_size": 1000,
								"bet_multiple": 3,
								"basic_bet": 20,
								"total_bet": 60000,
								"id": 13,
								"bet_size_s": "0.10",
								"total_bet_s": "6.00"
							},
							{
								"bet_size": 1000,
								"bet_multiple": 4,
								"basic_bet": 20,
								"total_bet": 80000,
								"id": 14,
								"bet_size_s": "0.10",
								"total_bet_s": "8.00"
							},
							{
								"bet_size": 1000,
								"bet_multiple": 5,
								"basic_bet": 20,
								"total_bet": 100000,
								"id": 15,
								"bet_size_s": "0.10",
								"total_bet_s": "10.00"
							},
							{
								"bet_size": 1000,
								"bet_multiple": 6,
								"basic_bet": 20,
								"total_bet": 120000,
								"id": 16,
								"bet_size_s": "0.10",
								"total_bet_s": "12.00"
							},
							{
								"bet_size": 1000,
								"bet_multiple": 7,
								"basic_bet": 20,
								"total_bet": 140000,
								"id": 17,
								"bet_size_s": "0.10",
								"total_bet_s": "14.00"
							},
							{
								"bet_size": 1000,
								"bet_multiple": 8,
								"basic_bet": 20,
								"total_bet": 160000,
								"id": 18,
								"bet_size_s": "0.10",
								"total_bet_s": "16.00"
							},
							{
								"bet_size": 1000,
								"bet_multiple": 9,
								"basic_bet": 20,
								"total_bet": 180000,
								"id": 19,
								"bet_size_s": "0.10",
								"total_bet_s": "18.00"
							},
							{
								"bet_size": 1000,
								"bet_multiple": 10,
								"basic_bet": 20,
								"total_bet": 200000,
								"id": 20,
								"bet_size_s": "0.10",
								"total_bet_s": "20.00"
							},
							{
								"bet_size": 5000,
								"bet_multiple": 1,
								"basic_bet": 20,
								"total_bet": 100000,
								"id": 21,
								"bet_size_s": "0.50",
								"total_bet_s": "10.00"
							},
							{
								"bet_size": 5000,
								"bet_multiple": 2,
								"basic_bet": 20,
								"total_bet": 200000,
								"id": 22,
								"bet_size_s": "0.50",
								"total_bet_s": "20.00"
							},
							{
								"bet_size": 5000,
								"bet_multiple": 3,
								"basic_bet": 20,
								"total_bet": 300000,
								"id": 23,
								"bet_size_s": "0.50",
								"total_bet_s": "30.00"
							},
							{
								"bet_size": 5000,
								"bet_multiple": 4,
								"basic_bet": 20,
								"total_bet": 400000,
								"id": 24,
								"bet_size_s": "0.50",
								"total_bet_s": "40.00"
							},
							{
								"bet_size": 5000,
								"bet_multiple": 5,
								"basic_bet": 20,
								"total_bet": 500000,
								"id": 25,
								"bet_size_s": "0.50",
								"total_bet_s": "50.00"
							},
							{
								"bet_size": 5000,
								"bet_multiple": 6,
								"basic_bet": 20,
								"total_bet": 600000,
								"id": 26,
								"bet_size_s": "0.50",
								"total_bet_s": "60.00"
							},
							{
								"bet_size": 5000,
								"bet_multiple": 7,
								"basic_bet": 20,
								"total_bet": 700000,
								"id": 27,
								"bet_size_s": "0.50",
								"total_bet_s": "70.00"
							},
							{
								"bet_size": 5000,
								"bet_multiple": 8,
								"basic_bet": 20,
								"total_bet": 800000,
								"id": 28,
								"bet_size_s": "0.50",
								"total_bet_s": "80.00"
							},
							{
								"bet_size": 5000,
								"bet_multiple": 9,
								"basic_bet": 20,
								"total_bet": 900000,
								"id": 29,
								"bet_size_s": "0.50",
								"total_bet_s": "90.00"
							},
							{
								"bet_size": 5000,
								"bet_multiple": 10,
								"basic_bet": 20,
								"total_bet": 1000000,
								"id": 30,
								"bet_size_s": "0.50",
								"total_bet_s": "100.00"
							},
							{
								"bet_size": 25000,
								"bet_multiple": 1,
								"basic_bet": 20,
								"total_bet": 500000,
								"id": 31,
								"bet_size_s": "2.50",
								"total_bet_s": "50.00"
							},
							{
								"bet_size": 25000,
								"bet_multiple": 2,
								"basic_bet": 20,
								"total_bet": 1000000,
								"id": 32,
								"bet_size_s": "2.50",
								"total_bet_s": "100.00"
							},
							{
								"bet_size": 25000,
								"bet_multiple": 3,
								"basic_bet": 20,
								"total_bet": 1500000,
								"id": 33,
								"bet_size_s": "2.50",
								"total_bet_s": "150.00"
							},
							{
								"bet_size": 25000,
								"bet_multiple": 4,
								"basic_bet": 20,
								"total_bet": 2000000,
								"id": 34,
								"bet_size_s": "2.50",
								"total_bet_s": "200.00"
							},
							{
								"bet_size": 25000,
								"bet_multiple": 5,
								"basic_bet": 20,
								"total_bet": 2500000,
								"id": 35,
								"bet_size_s": "2.50",
								"total_bet_s": "250.00"
							},
							{
								"bet_size": 25000,
								"bet_multiple": 6,
								"basic_bet": 20,
								"total_bet": 3000000,
								"id": 36,
								"bet_size_s": "2.50",
								"total_bet_s": "300.00"
							},
							{
								"bet_size": 25000,
								"bet_multiple": 7,
								"basic_bet": 20,
								"total_bet": 3500000,
								"id": 37,
								"bet_size_s": "2.50",
								"total_bet_s": "350.00"
							},
							{
								"bet_size": 25000,
								"bet_multiple": 8,
								"basic_bet": 20,
								"total_bet": 4000000,
								"id": 38,
								"bet_size_s": "2.50",
								"total_bet_s": "400.00"
							},
							{
								"bet_size": 25000,
								"bet_multiple": 9,
								"basic_bet": 20,
								"total_bet": 4500000,
								"id": 39,
								"bet_size_s": "2.50",
								"total_bet_s": "450.00"
							},
							{
								"bet_size": 25000,
								"bet_multiple": 10,
								"basic_bet": 20,
								"total_bet": 5000000,
								"id": 40,
								"bet_size_s": "2.50",
								"total_bet_s": "500.00"
							}
						],
						"default_id": 10,
						"addSubCombination": [
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
						]
					},
					"req": {}
				}


			} else if (route == Routes.req_bet) {

				if (this.norCount % 5 == 4) {
					info = {
						"error_code": 0,
						"data": {
							"result": {
								"round_list": [
									{
										"item_type_list": [
											8,
											2,
											8,
											8,
											10,
											9,
											8,
											4,
											8,
											8,
											3,
											6,
											27,
											2,
											6,
											5,
											7,
											10,
											2,
											4
										],
										"round_rate": 18,
										"round": 1,
										"multi_time": 1,
										"prize_list": [
											{
												"win_pos_list": [
													0,
													2,
													3,
													6,
													8,
													9
												],
												"count": 6,
												"level": 3,
												"item_type": 8,
												"rate": 3,
												"win": 54000,
												"win_s": "5.40"
											}
										],
										"next_list": [
											8,
											5,
											7,
											5,
											2
										],
										"list": null,
										"win_pos_list": [
											0,
											2,
											3,
											6,
											8,
											9
										],
										"dyadic_list": [
											{
												"list": [
													4,
													6,
													8,
													3
												]
											},
											{
												"list": [
													5,
													10
												]
											},
											{
												"list": [
													5,
													7,
													10
												]
											},
											{
												"list": null
											},
											{
												"list": null
											}
										],
										"round_id": "5018025886",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													8,
													2,
													8,
													8
												]
											},
											{
												"list": [
													10,
													9,
													8,
													4
												]
											},
											{
												"list": [
													8,
													8,
													3,
													6
												]
											},
											{
												"list": [
													27,
													2,
													6,
													5
												]
											},
											{
												"list": [
													7,
													10,
													2,
													4
												]
											}
										],
										"win_symbol_point": null,
										"origin_round_rate": 18,
										"free_play": 0,
										"balance": 99964000,
										"balance_s": "9996.40",
										"win_s": "5.40",
										"win": 54000,
										"player_win_lose_s": ""
									},
									{
										"item_type_list": [
											4,
											6,
											8,
											2,
											5,
											10,
											9,
											4,
											5,
											7,
											3,
											6,
											27,
											2,
											6,
											5,
											7,
											10,
											2,
											4
										],
										"round_rate": 0,
										"round": 2,
										"multi_time": 2,
										"prize_list": null,
										"next_list": [
											3,
											10,
											10,
											5,
											2
										],
										"list": null,
										"win_pos_list": null,
										"dyadic_list": null,
										"round_id": "5570520266",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													4,
													6,
													8,
													2
												]
											},
											{
												"list": [
													5,
													10,
													9,
													4
												]
											},
											{
												"list": [
													5,
													7,
													3,
													6
												]
											},
											{
												"list": [
													27,
													2,
													6,
													5
												]
											},
											{
												"list": [
													7,
													10,
													2,
													4
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
								"rate": 18,
								"scatter_count": 3,
								"free_play": 12,
								"scatter_symbol_point": [
									101,
									405,
									505
								],
								"origin_rate": 18,
								"is_end_free": false
							},
							"round_no": "8467824851",
							"order_id": "11-1705455475-EUP0HRZ9",
							"balance": 99964000,
							"balance_before_score": 99970000,
							"bet": 0,
							"prize": 54000,
							"player_win_lose": -6000,
							"free": true,
							"free_total_times": 12,
							"free_remain_times": 12,
							"free_game_total_win": 0,
							"dbg": [
								"使用数组=3, 必杀盈利率=2.50, 权重(10/290)",
								"本轮是否进免费游戏=true, 随机值=4, 权重(10/290)",
								"默认数组生成, 随机结果上下浮动=[18~18], 随机值=18",
								"玩家本次下注=6.00, 中奖=5.40, 输赢=-0.60",
								"倍率=18",
								"免费游戏剩余次数=12, 总次数=12",
								"[Ｋ,夺宝,Ｋ,Ｋ,Ｊ,Ｑ,Ｋ,吉他,Ｋ,Ｋ,大盗,彩球,金10,夺宝,彩球,饮料,Ａ,Ｊ,夺宝,吉他,]\n",
								"[图标:Ｋ, 轴:3, 总线数6, 中奖倍率:3, 乘数:1] ",
								"[吉他,彩球,Ｋ,夺宝,饮料,Ｊ,Ｑ,吉他,饮料,Ａ,大盗,彩球,金10,夺宝,彩球,饮料,Ａ,Ｊ,夺宝,吉他,]\n"
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"bet": 0,
							"id": 10,
							"idempotent": "1705455479281"
						}
					}
				} else {
					info = {
						"error_code": 0,
						"data": {
							"result": {
								"round_list": [
									{
										"item_type_list": [
											6,
											7,
											9,
											9,
											6,
											3,
											6,
											7,
											4,
											10,
											19,
											6,
											10,
											10,
											3,
											10,
											8,
											10,
											7,
											3
										],
										"round_rate": 10,
										"round": 1,
										"multi_time": 1,
										"prize_list": [
											{
												"win_pos_list": [
													0,
													4,
													6,
													11
												],
												"count": 2,
												"level": 3,
												"item_type": 6,
												"rate": 5,
												"win": 30000,
												"win_s": "3.00"
											}
										],
										"next_list": [
											4,
											9,
											8,
											9,
											2
										],
										"list": null,
										"win_pos_list": [
											0,
											4,
											6,
											11
										],
										"dyadic_list": [
											{
												"list": [
													4,
													9
												]
											},
											{
												"list": [
													10,
													9,
													6
												]
											},
											{
												"list": [
													8,
													10
												]
											},
											{
												"list": null
											},
											{
												"list": null
											}
										],
										"round_id": "1326660820",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													6,
													7,
													9,
													9
												]
											},
											{
												"list": [
													6,
													3,
													6,
													7
												]
											},
											{
												"list": [
													4,
													10,
													19,
													6
												]
											},
											{
												"list": [
													10,
													10,
													3,
													10
												]
											},
											{
												"list": [
													8,
													10,
													7,
													3
												]
											}
										],
										"win_symbol_point": null,
										"origin_round_rate": 10,
										"free_play": 0,
										"balance": 99970000,
										"balance_s": "9997.00",
										"win_s": "3.00",
										"win": 30000,
										"player_win_lose_s": ""
									},
									{
										"item_type_list": [
											4,
											7,
											9,
											9,
											10,
											9,
											3,
											7,
											8,
											4,
											10,
											19,
											10,
											10,
											3,
											10,
											8,
											10,
											7,
											3
										],
										"round_rate": 0,
										"round": 2,
										"multi_time": 2,
										"prize_list": null,
										"next_list": [
											9,
											6,
											10,
											9,
											2
										],
										"list": null,
										"win_pos_list": null,
										"dyadic_list": null,
										"round_id": "2723449181",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													4,
													7,
													9,
													9
												]
											},
											{
												"list": [
													10,
													9,
													3,
													7
												]
											},
											{
												"list": [
													8,
													4,
													10,
													19
												]
											},
											{
												"list": [
													10,
													10,
													3,
													10
												]
											},
											{
												"list": [
													8,
													10,
													7,
													3
												]
											}
										],
										"win_symbol_point": null,
										"origin_round_rate": 0,
										"free_play": 0,
										"balance": 99970000,
										"balance_s": "9997.00",
										"win_s": "0.00",
										"win": 0,
										"player_win_lose_s": ""
									}
								],
								"rate": 10,
								"scatter_count": 0,
								"free_play": 0,
								"scatter_symbol_point": null,
								"origin_rate": 10,
								"is_end_free": false
							},
							"round_no": "5348817733",
							"order_id": "11-1705455354-MY92J6X6",
							"balance": 99970000,
							"balance_before_score": 100000000,
							"bet": 0,
							"prize": 30000 * Math.floor(Math.random() * 40),//test
							"player_win_lose": -30000,
							"free": false,
							"free_total_times": 0,
							"free_remain_times": 0,
							"free_game_total_win": 0,
							"dbg": [
								"使用数组=3, 必杀盈利率=2.50, 权重(10/290)",
								"本轮是否进免费游戏=false, 随机值=299, 权重(10/290)",
								"采用数组=3, 随机结果上下浮动=[10~10], 随机值=10",
								"玩家本次下注=6.00, 中奖=3.00, 输赢=-3.00",
								"倍率=10",
								"[彩球,Ａ,Ｑ,Ｑ,彩球,大盗,彩球,Ａ,吉他,Ｊ,金大盗,彩球,Ｊ,Ｊ,大盗,Ｊ,Ｋ,Ｊ,Ａ,大盗,]\n",
								"[图标:彩球, 轴:3, 总线数2, 中奖倍率:5, 乘数:1] ",
								"[吉他,Ａ,Ｑ,Ｑ,Ｊ,Ｑ,大盗,Ａ,Ｋ,吉他,Ｊ,金大盗,Ｊ,Ｊ,大盗,Ｊ,Ｋ,Ｊ,Ａ,大盗,]\n"
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"bet": 0,
							"id": 10,
							"idempotent": "1705455358769"
						}
					}
				}

				this.norCount++

			} else if (route == Routes.req_free) {
				if (this.freeCount == 0) {
					info = {
						"error_code": 0,
						"data": {
							"result": {
								"round_list": [
									{
										"item_type_list": [
											10,
											11,
											8,
											4,
											19,
											11,
											6,
											2,
											23,
											21,
											19,
											24,
											11,
											3,
											9,
											10,
											8,
											11,
											3,
											7
										],
										"round_rate": 0,
										"round": 1,
										"multi_time": 1,
										"prize_list": null,
										"next_list": [
											3,
											6,
											19,
											25,
											8
										],
										"list": null,
										"win_pos_list": null,
										"dyadic_list": null,
										"round_id": "2079950522",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													10,
													11,
													8,
													4
												]
											},
											{
												"list": [
													19,
													11,
													6,
													2
												]
											},
											{
												"list": [
													23,
													21,
													19,
													24
												]
											},
											{
												"list": [
													11,
													3,
													9,
													10
												]
											},
											{
												"list": [
													8,
													11,
													3,
													7
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
							"round_no": "11-1705455490-BWNKBE5B",
							"order_id": "11-1705455475-EUP0HRZ9",
							"balance": 99964000,
							"balance_before_score": 99964000,
							"bet": 60000,
							"prize": 0,
							"player_win_lose": 0,
							"trigger_free": false,
							"free_total_times": 12,
							"free_remain_times": 11,
							"free_game_total_win": 0,
							"dbg": [
								"采用数组=3, 随机结果上下浮动=[0~0], 随机值=0",
								"玩家本输赢=0.00",
								"倍率=0"
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"idempotent": "1705455494342"
						}
					}

				} else if (this.freeCount == 1) {
					info = {
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

				} else if (this.freeCount == 2) {
					info = {
						"error_code": 0,
						"data": {
							"result": {
								"round_list": [
									{
										"item_type_list": [
											11,
											2,
											3,
											11,
											4,
											10,
											9,
											8,
											24,
											19,
											27,
											26,
											9,
											6,
											5,
											10,
											4,
											8,
											5,
											10
										],
										"round_rate": 0,
										"round": 1,
										"multi_time": 1,
										"prize_list": null,
										"next_list": [
											5,
											27,
											21,
											10,
											11
										],
										"list": null,
										"win_pos_list": null,
										"dyadic_list": null,
										"round_id": "6040762508",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													11,
													2,
													3,
													11
												]
											},
											{
												"list": [
													4,
													10,
													9,
													8
												]
											},
											{
												"list": [
													24,
													19,
													27,
													26
												]
											},
											{
												"list": [
													9,
													6,
													5,
													10
												]
											},
											{
												"list": [
													4,
													8,
													5,
													10
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
							"round_no": "11-1705455496-9BCT7A8F",
							"order_id": "11-1705455475-EUP0HRZ9",
							"balance": 99964000,
							"balance_before_score": 99964000,
							"bet": 60000,
							"prize": 0,
							"player_win_lose": 0,
							"trigger_free": false,
							"free_total_times": 12,
							"free_remain_times": 9,
							"free_game_total_win": 0,
							"dbg": [
								"玩家本输赢=0.00",
								"倍率=0"
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"idempotent": "1705455500461"
						}
					}

				} else if (this.freeCount == 3) {
					info = {
						"error_code": 0,
						"data": {
							"result": {
								"round_list": [
									{
										"item_type_list": [
											9,
											7,
											4,
											4,
											4,
											10,
											3,
											8,
											19,
											27,
											24,
											25,
											3,
											6,
											8,
											24,
											3,
											6,
											8,
											11
										],
										"round_rate": 0,
										"round": 1,
										"multi_time": 1,
										"prize_list": null,
										"next_list": [
											6,
											9,
											27,
											6,
											6
										],
										"list": null,
										"win_pos_list": null,
										"dyadic_list": null,
										"round_id": "1861498242",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													9,
													7,
													4,
													4
												]
											},
											{
												"list": [
													4,
													10,
													3,
													8
												]
											},
											{
												"list": [
													19,
													27,
													24,
													25
												]
											},
											{
												"list": [
													3,
													6,
													8,
													24
												]
											},
											{
												"list": [
													3,
													6,
													8,
													11
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
								"scatter_count": 0,
								"free_play": 0,
								"scatter_symbol_point": null,
								"origin_rate": 0,
								"is_end_free": false
							},
							"round_no": "11-1705455498-6ZCK32C7",
							"order_id": "11-1705455475-EUP0HRZ9",
							"balance": 99964000,
							"balance_before_score": 99964000,
							"bet": 60000,
							"prize": 0,
							"player_win_lose": 0,
							"trigger_free": false,
							"free_total_times": 12,
							"free_remain_times": 6,
							"free_game_total_win": 0,
							"dbg": [
								"玩家本输赢=0.00",
								"倍率=0"
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"idempotent": "1705455503231"
						}
					}

				} else if (this.freeCount == 4) {
					info = {
						"error_code": 0,
						"data": {
							"result": {
								"round_list": [
									{
										"item_type_list": [
											11,
											4,
											9,
											11,
											8,
											8,
											9,
											3,
											19,
											19,
											27,
											24,
											23,
											5,
											5,
											7,
											2,
											10,
											7,
											5
										],
										"round_rate": 0,
										"round": 1,
										"multi_time": 1,
										"prize_list": null,
										"next_list": [
											5,
											10,
											24,
											11,
											2
										],
										"list": null,
										"win_pos_list": null,
										"dyadic_list": null,
										"round_id": "0339682308",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													11,
													4,
													9,
													11
												]
											},
											{
												"list": [
													8,
													8,
													9,
													3
												]
											},
											{
												"list": [
													19,
													19,
													27,
													24
												]
											},
											{
												"list": [
													23,
													5,
													5,
													7
												]
											},
											{
												"list": [
													2,
													10,
													7,
													5
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
							"round_no": "11-1705455501-RGBVJHD9",
							"order_id": "11-1705455475-EUP0HRZ9",
							"balance": 99964000,
							"balance_before_score": 99964000,
							"bet": 60000,
							"prize": 0,
							"player_win_lose": 0,
							"trigger_free": false,
							"free_total_times": 12,
							"free_remain_times": 5,
							"free_game_total_win": 0,
							"dbg": [
								"玩家本输赢=0.00",
								"倍率=0"
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"idempotent": "1705455505317"
						}
					}

				} else if (this.freeCount == 5) {
					info = {
						"error_code": 0,
						"data": {
							"result": {
								"round_list": [
									{
										"item_type_list": [
											5,
											2,
											4,
											10,
											8,
											10,
											4,
											2,
											23,
											27,
											27,
											25,
											4,
											11,
											6,
											5,
											4,
											7,
											9,
											6
										],
										"round_rate": 0,
										"round": 1,
										"multi_time": 1,
										"prize_list": null,
										"next_list": [
											3,
											6,
											25,
											9,
											4
										],
										"list": null,
										"win_pos_list": null,
										"dyadic_list": null,
										"round_id": "9705323359",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													5,
													2,
													4,
													10
												]
											},
											{
												"list": [
													8,
													10,
													4,
													2
												]
											},
											{
												"list": [
													23,
													27,
													27,
													25
												]
											},
											{
												"list": [
													4,
													11,
													6,
													5
												]
											},
											{
												"list": [
													4,
													7,
													9,
													6
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
							"round_no": "11-1705455503-P3P6ER8F",
							"order_id": "11-1705455475-EUP0HRZ9",
							"balance": 99964000,
							"balance_before_score": 99964000,
							"bet": 60000,
							"prize": 0,
							"player_win_lose": 0,
							"trigger_free": false,
							"free_total_times": 12,
							"free_remain_times": 4,
							"free_game_total_win": 0,
							"dbg": [
								"玩家本输赢=0.00",
								"倍率=0"
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"idempotent": "1705455507528"
						}
					}

				} else if (this.freeCount == 6) {
					info = {
						"error_code": 0,
						"data": {
							"result": {
								"round_list": [
									{
										"item_type_list": [
											10,
											10,
											11,
											9,
											10,
											5,
											7,
											3,
											25,
											19,
											2,
											24,
											19,
											3,
											2,
											10,
											9,
											7,
											6,
											4
										],
										"round_rate": 0,
										"round": 1,
										"multi_time": 1,
										"prize_list": null,
										"next_list": [
											5,
											11,
											19,
											7,
											10
										],
										"list": null,
										"win_pos_list": null,
										"dyadic_list": null,
										"round_id": "2216735336",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													10,
													10,
													11,
													9
												]
											},
											{
												"list": [
													10,
													5,
													7,
													3
												]
											},
											{
												"list": [
													25,
													19,
													2,
													24
												]
											},
											{
												"list": [
													19,
													3,
													2,
													10
												]
											},
											{
												"list": [
													9,
													7,
													6,
													4
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
							"round_no": "11-1705455516-QE4CFS9Q",
							"order_id": "11-1705455475-EUP0HRZ9",
							"balance": 99964000,
							"balance_before_score": 99964000,
							"bet": 60000,
							"prize": 0,
							"player_win_lose": 0,
							"trigger_free": false,
							"free_total_times": 12,
							"free_remain_times": 3,
							"free_game_total_win": 0,
							"dbg": [
								"玩家本输赢=0.00",
								"倍率=0"
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"idempotent": "1705455520925"
						}
					}

				} else if (this.freeCount == 7) {
					info = {
						"error_code": 0,
						"data": {
							"result": {
								"round_list": [
									{
										"item_type_list": [
											4,
											5,
											11,
											8,
											10,
											8,
											11,
											11,
											25,
											23,
											2,
											22,
											4,
											4,
											6,
											6,
											7,
											10,
											4,
											3
										],
										"round_rate": 0,
										"round": 1,
										"multi_time": 1,
										"prize_list": null,
										"next_list": [
											10,
											6,
											25,
											5,
											8
										],
										"list": null,
										"win_pos_list": null,
										"dyadic_list": null,
										"round_id": "4687327979",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													4,
													5,
													11,
													8
												]
											},
											{
												"list": [
													10,
													8,
													11,
													11
												]
											},
											{
												"list": [
													25,
													23,
													2,
													22
												]
											},
											{
												"list": [
													4,
													4,
													6,
													6
												]
											},
											{
												"list": [
													7,
													10,
													4,
													3
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
							"round_no": "11-1705455522-074AUR3S",
							"order_id": "11-1705455475-EUP0HRZ9",
							"balance": 99964000,
							"balance_before_score": 99964000,
							"bet": 60000,
							"prize": 0,
							"player_win_lose": 0,
							"trigger_free": false,
							"free_total_times": 12,
							"free_remain_times": 2,
							"free_game_total_win": 0,
							"dbg": [
								"玩家本输赢=0.00",
								"倍率=0"
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"idempotent": "1705455526853"
						}
					}


				} else if (this.freeCount == 8) {
					info = {
						"error_code": 0,
						"data": {
							"result": {
								"round_list": [
									{
										"item_type_list": [
											6,
											3,
											7,
											8,
											9,
											3,
											25,
											11,
											25,
											27,
											23,
											20,
											3,
											6,
											6,
											9,
											8,
											11,
											5,
											10
										],
										"round_rate": 0,
										"round": 1,
										"multi_time": 1,
										"prize_list": null,
										"next_list": [
											11,
											11,
											23,
											3,
											5
										],
										"list": null,
										"win_pos_list": null,
										"dyadic_list": null,
										"round_id": "3144525628",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													6,
													3,
													7,
													8
												]
											},
											{
												"list": [
													9,
													3,
													25,
													11
												]
											},
											{
												"list": [
													25,
													27,
													23,
													20
												]
											},
											{
												"list": [
													3,
													6,
													6,
													9
												]
											},
											{
												"list": [
													8,
													11,
													5,
													10
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
								"scatter_count": 0,
								"free_play": 0,
								"scatter_symbol_point": null,
								"origin_rate": 0,
								"is_end_free": false
							},
							"round_no": "11-1705455524-DBZJ8X8W",
							"order_id": "11-1705455475-EUP0HRZ9",
							"balance": 99964000,
							"balance_before_score": 99964000,
							"bet": 60000,
							"prize": 0,
							"player_win_lose": 0,
							"trigger_free": false,
							"free_total_times": 12,
							"free_remain_times": 1,
							"free_game_total_win": 0,
							"dbg": [
								"玩家本输赢=0.00",
								"倍率=0"
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"idempotent": "1705455529091"
						}
					}


				} else if (this.freeCount == 9) {
					info = {
						"error_code": 0,
						"data": {
							"result": {
								"round_list": [
									{
										"item_type_list": [
											8,
											9,
											3,
											4,
											7,
											3,
											10,
											11,
											25,
											21,
											25,
											26,
											4,
											7,
											6,
											7,
											3,
											10,
											8,
											7
										],
										"round_rate": 0,
										"round": 1,
										"multi_time": 1,
										"prize_list": null,
										"next_list": [
											4,
											4,
											22,
											2,
											4
										],
										"list": null,
										"win_pos_list": null,
										"dyadic_list": null,
										"round_id": "5018567835",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													8,
													9,
													3,
													4
												]
											},
											{
												"list": [
													7,
													3,
													10,
													11
												]
											},
											{
												"list": [
													25,
													21,
													25,
													26
												]
											},
											{
												"list": [
													4,
													7,
													6,
													7
												]
											},
											{
												"list": [
													3,
													10,
													8,
													7
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
								"scatter_count": 0,
								"free_play": 0,
								"scatter_symbol_point": null,
								"origin_rate": 0,
								"is_end_free": true
							},
							"round_no": "11-1705455526-FY6TC8BH",
							"order_id": "11-1705455475-EUP0HRZ9",
							"balance": 99964000,
							"balance_before_score": 99964000,
							"bet": 60000,
							"prize": 0,
							"player_win_lose": 0,
							"trigger_free": false,
							"free_total_times": 12,
							"free_remain_times": 0,
							"free_game_total_win": 0,
							"dbg": [
								"玩家本输赢=0.00",
								"倍率=0"
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"idempotent": "1705455531162"
						}
					}



				} else if (this.freeCount == 10) {
					info = {
						"error_code": 0,
						"data": {
							"result": {
								"round_list": [
									{
										"item_type_list": [
											5,
											10,
											9,
											6,
											3,
											9,
											6,
											10,
											2,
											8,
											19,
											6,
											3,
											5,
											6,
											3,
											11,
											8,
											10,
											6
										],
										"round_rate": 15,
										"round": 1,
										"multi_time": 1,
										"prize_list": [
											{
												"win_pos_list": [
													3,
													6,
													11,
													14,
													19
												],
												"count": 1,
												"level": 5,
												"item_type": 6,
												"rate": 15,
												"win": 45000,
												"win_s": "4.50"
											}
										],
										"next_list": [
											11,
											27,
											9,
											7,
											8
										],
										"list": null,
										"win_pos_list": [
											3,
											6,
											11,
											14,
											19
										],
										"dyadic_list": [
											{
												"list": [
													11,
													6
												]
											},
											{
												"list": [
													27,
													11
												]
											},
											{
												"list": [
													9,
													5
												]
											},
											{
												"list": [
													7,
													9
												]
											},
											{
												"list": [
													8,
													5
												]
											}
										],
										"round_id": "9756469093",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													5,
													10,
													9,
													6
												]
											},
											{
												"list": [
													3,
													9,
													6,
													10
												]
											},
											{
												"list": [
													2,
													8,
													19,
													6
												]
											},
											{
												"list": [
													3,
													5,
													6,
													3
												]
											},
											{
												"list": [
													11,
													8,
													10,
													6
												]
											}
										],
										"win_symbol_point": null,
										"origin_round_rate": 15,
										"free_play": 0,
										"balance": 99949000,
										"balance_s": "9994.90",
										"win_s": "4.50",
										"win": 45000,
										"player_win_lose_s": ""
									},
									{
										"item_type_list": [
											11,
											5,
											10,
											9,
											27,
											3,
											9,
											10,
											9,
											2,
											8,
											19,
											7,
											3,
											5,
											3,
											8,
											11,
											8,
											10
										],
										"round_rate": 4,
										"round": 2,
										"multi_time": 2,
										"prize_list": [
											{
												"win_pos_list": [
													3,
													6,
													8
												],
												"count": 1,
												"level": 3,
												"item_type": 9,
												"rate": 2,
												"win": 6000,
												"win_s": "0.60"
											}
										],
										"next_list": [
											6,
											11,
											5,
											9,
											5
										],
										"list": null,
										"win_pos_list": [
											3,
											6,
											8
										],
										"dyadic_list": [
											{
												"list": [
													6,
													3
												]
											},
											{
												"list": [
													11,
													11
												]
											},
											{
												"list": [
													5,
													10
												]
											},
											{
												"list": null
											},
											{
												"list": null
											}
										],
										"round_id": "7166056057",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													11,
													5,
													10,
													9
												]
											},
											{
												"list": [
													27,
													3,
													9,
													10
												]
											},
											{
												"list": [
													9,
													2,
													8,
													19
												]
											},
											{
												"list": [
													7,
													3,
													5,
													3
												]
											},
											{
												"list": [
													8,
													11,
													8,
													10
												]
											}
										],
										"win_symbol_point": null,
										"origin_round_rate": 2,
										"free_play": 0,
										"balance": 99961000,
										"balance_s": "9996.10",
										"win_s": "1.20",
										"win": 12000,
										"player_win_lose_s": ""
									},
									{
										"item_type_list": [
											6,
											11,
											5,
											10,
											11,
											27,
											3,
											10,
											5,
											2,
											8,
											19,
											7,
											3,
											5,
											3,
											8,
											11,
											8,
											10
										],
										"round_rate": 0,
										"round": 3,
										"multi_time": 3,
										"prize_list": null,
										"next_list": [
											3,
											11,
											10,
											9,
											5
										],
										"list": null,
										"win_pos_list": null,
										"dyadic_list": null,
										"round_id": "7869990718",
										"gold_change_list": null,
										"col_symbol_list": [
											{
												"list": [
													6,
													11,
													5,
													10
												]
											},
											{
												"list": [
													11,
													27,
													3,
													10
												]
											},
											{
												"list": [
													5,
													2,
													8,
													19
												]
											},
											{
												"list": [
													7,
													3,
													5,
													3
												]
											},
											{
												"list": [
													8,
													11,
													8,
													10
												]
											}
										],
										"win_symbol_point": null,
										"origin_round_rate": 0,
										"free_play": 0,
										"balance": 99961000,
										"balance_s": "9996.10",
										"win_s": "300.00",
										"win": 6000000,
										"player_win_lose_s": "500"
									}
								],
								"rate": 19,
								"scatter_count": 0,
								"free_play": 0,
								"scatter_symbol_point": null,
								"origin_rate": 17,
								"is_end_free": false
							},
							"round_no": "4658379460",
							"order_id": "11-1705455562-H455UB3A",
							"balance": 99961000,
							"balance_before_score": 99964000,
							"bet": 0,
							"prize": 57000,
							"player_win_lose": -3000,
							"free": false,
							"free_total_times": 0,
							"free_remain_times": 0,
							"free_game_total_win": 700000,
							"dbg": [
								"使用数组=3, 必杀盈利率=2.50, 权重(10/290)",
								"本轮是否进免费游戏=false, 随机值=30, 权重(10/290)",
								"采用数组=3, 随机结果上下浮动=[19~19], 随机值=19",
								"玩家本次下注=6.00, 中奖=5.70, 输赢=-0.30",
								"倍率=19",
								"[饮料,Ｊ,Ｑ,彩球,大盗,Ｑ,彩球,Ｊ,夺宝,Ｋ,金大盗,彩球,大盗,饮料,彩球,大盗,10,Ｋ,Ｊ,彩球,]\n",
								"[图标:彩球, 轴:5, 总线数1, 中奖倍率:15, 乘数:1] ",
								"[10,饮料,Ｊ,Ｑ,金10,大盗,Ｑ,Ｊ,Ｑ,夺宝,Ｋ,金大盗,Ａ,大盗,饮料,大盗,Ｋ,10,Ｋ,Ｊ,]\n",
								"[图标:Ｑ, 轴:3, 总线数1, 中奖倍率:2, 乘数:2] ",
								"[彩球,10,饮料,Ｊ,10,金10,大盗,Ｊ,饮料,夺宝,Ｋ,金大盗,Ａ,大盗,饮料,大盗,Ｋ,10,Ｋ,Ｊ,]\n"
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"bet": 0,
							"id": 10,
							"idempotent": "1705455566297"
						}
					}

					this.freeCount = -1

				}

				this.freeCount++

			} else if (route == Routes.req_history) {

				info = {
					"error_code": 0,
					"data": {
						"list": [
							{
								"create_timestamp": 1705455654907,
								"order_id": "11-1705455654-WADXVA95",
								"round_id": "6855471320",
								"bet": 60000,
								"win": -60000,
								"free_times": 0,
								"win_s": "-6.00",
								"bet_s": "6.00",
								"normal_round_no": "",
								"free_round_no": "",
								"free": false,
								"normal_round_times": 0,
								"free_round_times": 0
							},
							{
								"create_timestamp": 1705455642048,
								"order_id": "11-1705455642-2EVYFDV1",
								"round_id": "5131346621",
								"bet": 60000,
								"win": -54000,
								"free_times": 0,
								"win_s": "-5.40",
								"bet_s": "6.00",
								"normal_round_no": "",
								"free_round_no": "",
								"free": false,
								"normal_round_times": 1,
								"free_round_times": 0
							},
							{
								"create_timestamp": 1705455636041,
								"order_id": "11-1705455636-H9J13TMM",
								"round_id": "5192310288",
								"bet": 60000,
								"win": -36000,
								"free_times": 0,
								"win_s": "-3.60",
								"bet_s": "6.00",
								"normal_round_no": "",
								"free_round_no": "",
								"free": false,
								"normal_round_times": 1,
								"free_round_times": 0
							},
							{
								"create_timestamp": 1705455630379,
								"order_id": "11-1705455630-H39EUJJZ",
								"round_id": "5429264787",
								"bet": 60000,
								"win": -30000,
								"free_times": 0,
								"win_s": "-3.00",
								"bet_s": "6.00",
								"normal_round_no": "",
								"free_round_no": "",
								"free": false,
								"normal_round_times": 1,
								"free_round_times": 0
							},
							{
								"create_timestamp": 1705455622558,
								"order_id": "11-1705455622-U2FMHMXQ",
								"round_id": "4712919652",
								"bet": 60000,
								"win": -18000,
								"free_times": 0,
								"win_s": "-1.80",
								"bet_s": "6.00",
								"normal_round_no": "",
								"free_round_no": "",
								"free": false,
								"normal_round_times": 2,
								"free_round_times": 0
							},
							{
								"create_timestamp": 1705455614158,
								"order_id": "11-1705455614-K4C2H8N9",
								"round_id": "7462959710",
								"bet": 60000,
								"win": -42000,
								"free_times": 0,
								"win_s": "-4.20",
								"bet_s": "6.00",
								"normal_round_no": "",
								"free_round_no": "",
								"free": false,
								"normal_round_times": 1,
								"free_round_times": 0
							},
							{
								"create_timestamp": 1705455607725,
								"order_id": "11-1705455607-H61EHJN2",
								"round_id": "8757908153",
								"bet": 60000,
								"win": -57000,
								"free_times": 0,
								"win_s": "-5.70",
								"bet_s": "6.00",
								"normal_round_no": "",
								"free_round_no": "",
								"free": false,
								"normal_round_times": 1,
								"free_round_times": 0
							},
							{
								"create_timestamp": 1705455562229,
								"order_id": "11-1705455562-H455UB3A",
								"round_id": "9756469093",
								"bet": 60000,
								"win": -3000,
								"free_times": 0,
								"win_s": "-0.30",
								"bet_s": "6.00",
								"normal_round_no": "",
								"free_round_no": "",
								"free": false,
								"normal_round_times": 2,
								"free_round_times": 0
							},
							{
								"create_timestamp": 1705455475127,
								"order_id": "11-1705455475-EUP0HRZ9",
								"round_id": "5018025886",
								"bet": 60000,
								"win": -6000,
								"free_times": 12,
								"win_s": "-0.60",
								"bet_s": "6.00",
								"normal_round_no": "",
								"free_round_no": "",
								"free": false,
								"normal_round_times": 1,
								"free_round_times": 0
							},
							{
								"create_timestamp": 1705455355016,
								"order_id": "11-1705455354-MY92J6X6",
								"round_id": "1326660820",
								"bet": 60000,
								"win": -30000,
								"free_times": 0,
								"win_s": "-3.00",
								"bet_s": "6.00",
								"normal_round_no": "",
								"free_round_no": "",
								"free": false,
								"normal_round_times": 1,
								"free_round_times": 0
							}
						],
						"count": 10,
						"bet": 600000,
						"win": -336000,
						"id": 0,
						"bet_s": "60.00",
						"win_s": "-33.60"
					},
					"req": {
						"token": "DFECD631A01B49FD88E5A91AB9F655D4",
						"start_timestamp": 1705420801000,
						"end_timestamp": 1705455676918,
						"limit": 20,
						"page": 0,
						"id": 0,
						"offset": 0
					}
				}




			} else if (route == Routes.req_hisdetail) {

				let detRand = Math.random()

				if (detRand < 0.5) {
					info = {
						"error_code": 0,
						"data": {
							"list": [
								{
									"create_timestamp": 1705455355016,
									"order_id": "11-1705455354-MY92J6X6",
									"round_id": "1326660820",
									"create_time": "2024-01-17 09:35:55",
									"result": {
										"round_list": [
											{
												"item_type_list": [
													6,
													7,
													9,
													9,
													6,
													3,
													6,
													7,
													4,
													10,
													19,
													6,
													10,
													10,
													3,
													10,
													8,
													10,
													7,
													3
												],
												"round_rate": 10,
												"round": 1,
												"multi_time": 1,
												"prize_list": [
													{
														"win_pos_list": [
															0,
															4,
															6,
															11
														],
														"count": 2,
														"level": 3,
														"item_type": 6,
														"rate": 5,
														"win": 30000,
														"win_s": "3.00"
													}
												],
												"next_list": [
													4,
													9,
													8,
													9,
													2
												],
												"list": null,
												"win_pos_list": [
													0,
													4,
													6,
													11
												],
												"dyadic_list": [
													{
														"list": [
															4,
															9
														]
													},
													{
														"list": [
															10,
															9,
															6
														]
													},
													{
														"list": [
															8,
															10
														]
													},
													{
														"list": null
													},
													{
														"list": null
													}
												],
												"round_id": "1326660820",
												"gold_change_list": null,
												"col_symbol_list": [
													{
														"list": [
															6,
															7,
															9,
															9
														]
													},
													{
														"list": [
															6,
															3,
															6,
															7
														]
													},
													{
														"list": [
															4,
															10,
															19,
															6
														]
													},
													{
														"list": [
															10,
															10,
															3,
															10
														]
													},
													{
														"list": [
															8,
															10,
															7,
															3
														]
													}
												],
												"win_symbol_point": null,
												"origin_round_rate": 10,
												"free_play": 0,
												"balance": 99970000,
												"balance_s": "9997.00",
												"win_s": "3.00",
												"win": 30000,
												"player_win_lose_s": ""
											},
											{
												"item_type_list": [
													4,
													7,
													9,
													9,
													10,
													9,
													3,
													7,
													8,
													4,
													10,
													19,
													10,
													10,
													3,
													10,
													8,
													10,
													7,
													3
												],
												"round_rate": 0,
												"round": 2,
												"multi_time": 2,
												"prize_list": null,
												"next_list": [
													9,
													6,
													10,
													9,
													2
												],
												"list": null,
												"win_pos_list": null,
												"dyadic_list": null,
												"round_id": "2723449181",
												"gold_change_list": null,
												"col_symbol_list": [
													{
														"list": [
															4,
															7,
															9,
															9
														]
													},
													{
														"list": [
															10,
															9,
															3,
															7
														]
													},
													{
														"list": [
															8,
															4,
															10,
															19
														]
													},
													{
														"list": [
															10,
															10,
															3,
															10
														]
													},
													{
														"list": [
															8,
															10,
															7,
															3
														]
													}
												],
												"win_symbol_point": null,
												"origin_round_rate": 0,
												"free_play": 0,
												"balance": 99970000,
												"balance_s": "9997.00",
												"win_s": "0.00",
												"win": 0,
												"player_win_lose_s": ""
											}
										],
										"rate": 10,
										"scatter_count": 0,
										"free_play": 0,
										"scatter_symbol_point": null,
										"origin_rate": 10,
										"is_end_free": false
									},
									"round_list": [
										{
											"round_no": "1326660820",
											"bet": 60000,
											"prize": 30000,
											"player_win_lose": -30000,
											"balance": 99970000,
											"round": 1,
											"bet_size": 300,
											"bet_multiple": 10,
											"basic_bet": 20,
											"multi_time": 1,
											"item_type_list": [
												6,
												7,
												9,
												9,
												6,
												3,
												6,
												7,
												4,
												10,
												19,
												6,
												10,
												10,
												3,
												10,
												8,
												10,
												7,
												3
											],
											"prize_list": [
												{
													"win_pos_list": [
														0,
														4,
														6,
														11
													],
													"count": 2,
													"level": 3,
													"item_type": 6,
													"rate": 5,
													"win": 30000,
													"win_s": "3.00"
												}
											],
											"bet_s": "6.00",
											"prize_s": "3.00",
											"player_win_lose_s": "-3.00",
											"balance_s": "9997.00",
											"bet_size_s": "0.03"
										},
										{
											"round_no": "2723449181",
											"bet": 0,
											"prize": 0,
											"player_win_lose": 0,
											"balance": 99970000,
											"round": 2,
											"bet_size": 300,
											"bet_multiple": 10,
											"basic_bet": 20,
											"multi_time": 2,
											"item_type_list": [
												4,
												7,
												9,
												9,
												10,
												9,
												3,
												7,
												8,
												4,
												10,
												19,
												10,
												10,
												3,
												10,
												8,
												10,
												7,
												3
											],
											"prize_list": null,
											"bet_s": "0.00",
											"prize_s": "0.00",
											"player_win_lose_s": "0.00",
											"balance_s": "9997.00",
											"bet_size_s": "0.03"
										}
									],
									"balance": 99970000,
									"balance_before_score": 100000000,
									"bet": 60000,
									"prize": 30000,
									"player_win_lose": -30000,
									"free": false,
									"free_total_times": 0,
									"free_remain_times": 0,
									"free_game_total_win": 18446744073709521616,
									"bet_size": 300,
									"basic_bet": 20,
									"bet_multiple": 10
								}
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"order_id": "11-1705455354-MY92J6X6"
						}
					}
				} else {
					info = {
						"error_code": 0,
						"data": {
							"list": [
								{
									"create_timestamp": 1705455622558,
									"order_id": "11-1705455622-U2FMHMXQ",
									"round_id": "4712919652",
									"create_time": "2024-01-17 09:40:22",
									"result": {
										"round_list": [
											{
												"item_type_list": [
													8,
													8,
													11,
													4,
													4,
													3,
													7,
													11,
													8,
													8,
													4,
													3,
													7,
													9,
													11,
													7,
													10,
													6,
													9,
													7
												],
												"round_rate": 8,
												"round": 1,
												"multi_time": 1,
												"prize_list": [
													{
														"win_pos_list": [
															3,
															4,
															10
														],
														"count": 1,
														"level": 3,
														"item_type": 4,
														"rate": 8,
														"win": 24000,
														"win_s": "2.40"
													}
												],
												"next_list": [
													5,
													7,
													11,
													7,
													2
												],
												"list": null,
												"win_pos_list": [
													3,
													4,
													10
												],
												"dyadic_list": [
													{
														"list": [
															5,
															4
														]
													},
													{
														"list": [
															7,
															3
														]
													},
													{
														"list": [
															11,
															10
														]
													},
													{
														"list": null
													},
													{
														"list": null
													}
												],
												"round_id": "4712919652",
												"gold_change_list": null,
												"col_symbol_list": [
													{
														"list": [
															8,
															8,
															11,
															4
														]
													},
													{
														"list": [
															4,
															3,
															7,
															11
														]
													},
													{
														"list": [
															8,
															8,
															4,
															3
														]
													},
													{
														"list": [
															7,
															9,
															11,
															7
														]
													},
													{
														"list": [
															10,
															6,
															9,
															7
														]
													}
												],
												"win_symbol_point": null,
												"origin_round_rate": 8,
												"free_play": 0,
												"balance": 99826000,
												"balance_s": "9982.60",
												"win_s": "2.40",
												"win": 24000,
												"player_win_lose_s": ""
											},
											{
												"item_type_list": [
													5,
													8,
													8,
													11,
													7,
													3,
													7,
													11,
													11,
													8,
													8,
													3,
													7,
													9,
													11,
													7,
													10,
													6,
													9,
													7
												],
												"round_rate": 6,
												"round": 2,
												"multi_time": 2,
												"prize_list": [
													{
														"win_pos_list": [
															3,
															7,
															8,
															14
														],
														"count": 1,
														"level": 4,
														"item_type": 11,
														"rate": 3,
														"win": 18000,
														"win_s": "1.80"
													}
												],
												"next_list": [
													4,
													3,
													10,
													7,
													2
												],
												"list": null,
												"win_pos_list": [
													3,
													7,
													8,
													14
												],
												"dyadic_list": [
													{
														"list": [
															4,
															5
														]
													},
													{
														"list": [
															3,
															7
														]
													},
													{
														"list": [
															10,
															5
														]
													},
													{
														"list": [
															7,
															6
														]
													},
													{
														"list": null
													}
												],
												"round_id": "9076866754",
												"gold_change_list": null,
												"col_symbol_list": [
													{
														"list": [
															5,
															8,
															8,
															11
														]
													},
													{
														"list": [
															7,
															3,
															7,
															11
														]
													},
													{
														"list": [
															11,
															8,
															8,
															3
														]
													},
													{
														"list": [
															7,
															9,
															11,
															7
														]
													},
													{
														"list": [
															10,
															6,
															9,
															7
														]
													}
												],
												"win_symbol_point": null,
												"origin_round_rate": 3,
												"free_play": 0,
												"balance": 99844000,
												"balance_s": "9984.40",
												"win_s": "1.80",
												"win": 18000,
												"player_win_lose_s": ""
											},
											{
												"item_type_list": [
													4,
													5,
													8,
													8,
													3,
													7,
													3,
													7,
													10,
													8,
													8,
													3,
													7,
													7,
													9,
													7,
													10,
													6,
													9,
													7
												],
												"round_rate": 0,
												"round": 3,
												"multi_time": 3,
												"prize_list": null,
												"next_list": [
													5,
													7,
													5,
													6,
													2
												],
												"list": null,
												"win_pos_list": null,
												"dyadic_list": null,
												"round_id": "7794619509",
												"gold_change_list": null,
												"col_symbol_list": [
													{
														"list": [
															4,
															5,
															8,
															8
														]
													},
													{
														"list": [
															3,
															7,
															3,
															7
														]
													},
													{
														"list": [
															10,
															8,
															8,
															3
														]
													},
													{
														"list": [
															7,
															7,
															9,
															7
														]
													},
													{
														"list": [
															10,
															6,
															9,
															7
														]
													}
												],
												"win_symbol_point": null,
												"origin_round_rate": 0,
												"free_play": 0,
												"balance": 99844000,
												"balance_s": "9984.40",
												"win_s": "0.00",
												"win": 0,
												"player_win_lose_s": ""
											}
										],
										"rate": 14,
										"scatter_count": 0,
										"free_play": 0,
										"scatter_symbol_point": null,
										"origin_rate": 11,
										"is_end_free": false
									},
									"round_list": [
										{
											"round_no": "4712919652",
											"bet": 60000,
											"prize": 24000,
											"player_win_lose": -36000,
											"balance": 99826000,
											"round": 1,
											"bet_size": 300,
											"bet_multiple": 10,
											"basic_bet": 20,
											"multi_time": 1,
											"item_type_list": [
												8,
												8,
												11,
												4,
												4,
												3,
												7,
												11,
												8,
												8,
												4,
												3,
												7,
												9,
												11,
												7,
												10,
												6,
												9,
												7
											],
											"prize_list": [
												{
													"win_pos_list": [
														3,
														4,
														10
													],
													"count": 1,
													"level": 3,
													"item_type": 4,
													"rate": 8,
													"win": 24000,
													"win_s": "2.40"
												}
											],
											"bet_s": "6.00",
											"prize_s": "2.40",
											"player_win_lose_s": "-3.60",
											"balance_s": "9982.60",
											"bet_size_s": "0.03"
										},
										{
											"round_no": "9076866754",
											"bet": 0,
											"prize": 18000,
											"player_win_lose": 18000,
											"balance": 99844000,
											"round": 2,
											"bet_size": 300,
											"bet_multiple": 10,
											"basic_bet": 20,
											"multi_time": 2,
											"item_type_list": [
												5,
												8,
												8,
												11,
												7,
												3,
												7,
												11,
												11,
												8,
												8,
												3,
												7,
												9,
												11,
												7,
												10,
												6,
												9,
												7
											],
											"prize_list": [
												{
													"win_pos_list": [
														3,
														7,
														8,
														14
													],
													"count": 1,
													"level": 4,
													"item_type": 11,
													"rate": 3,
													"win": 18000,
													"win_s": "1.80"
												}
											],
											"bet_s": "0.00",
											"prize_s": "1.80",
											"player_win_lose_s": "1.80",
											"balance_s": "9984.40",
											"bet_size_s": "0.03"
										},
										{
											"round_no": "7794619509",
											"bet": 0,
											"prize": 0,
											"player_win_lose": 0,
											"balance": 99844000,
											"round": 3,
											"bet_size": 300,
											"bet_multiple": 10,
											"basic_bet": 20,
											"multi_time": 3,
											"item_type_list": [
												4,
												5,
												8,
												8,
												3,
												7,
												3,
												7,
												10,
												8,
												8,
												3,
												7,
												7,
												9,
												7,
												10,
												6,
												9,
												7
											],
											"prize_list": null,
											"bet_s": "0.00",
											"prize_s": "0.00",
											"player_win_lose_s": "0.00",
											"balance_s": "9984.40",
											"bet_size_s": "0.03"
										}
									],
									"balance": 99844000,
									"balance_before_score": 99862000,
									"bet": 60000,
									"prize": 42000,
									"player_win_lose": -18000,
									"free": false,
									"free_total_times": 0,
									"free_remain_times": 0,
									"free_game_total_win": 18446744073709533616,
									"bet_size": 300,
									"basic_bet": 20,
									"bet_multiple": 10
								}
							]
						},
						"req": {
							"token": "DFECD631A01B49FD88E5A91AB9F655D4",
							"order_id": "11-1705455622-U2FMHMXQ"
						}
					}
				}
			}

			if (callback) { callback(true, info); }
			EventCenter.getInstance().fire(route, info);


			return
		}


		HttpUtil.callPost(this._domain + "/" + route, dataStr, (iCode: EHttpResult, data: any) => {
			if (iCode !== EHttpResult.Succ) {
				if (callback) { callback(false, iCode); }
				logger.red("ERROR_TABLE: ", route, iCode);
			} else {
				let info = JSON.parse(data)

				if (!this._hidePrints[route]) {
					// logger.green("[RESP]", addr, JSON.stringify(info, null, 2));
					logger.blue("[===== RESP start ====]", route);
					warn(info)
					logger.blue("[====== RESP end ======]", route);
					// StringUtil.printLn(info);
				}
				if (info.error_code !== null && info.error_code !== undefined && info.error_code !== 0) {
					logger.red("ERROR_CODE: ", info.error_code, route);
					//ToastHelper.tip(info.error_msg);
					logger.red(info.error_msg);
					if (callback) { callback(false, info); }
				} else {
					if (callback) { callback(true, info); }
					EventCenter.getInstance().fire(route, info);
				}
			}
		});
	}
}