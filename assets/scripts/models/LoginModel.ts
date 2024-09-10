import { GameInfo, PlayerInfo } from "../interface/userinfo";
import BaseModel from "./BaseModel";

export default class LoginModel extends BaseModel {

	private token: string = "DFECD631A01B49FD88E5A91AB9F655D4"

	/**游戏相关信息 */
	gameInfo: GameInfo;

	/**玩家相关信息 */
	playerInfo: PlayerInfo;

	setToken(token) {
		this.token = token
	}

	getToken() {
		return this.token;
	}

	setPlayerInfo(info: PlayerInfo) {
		this.playerInfo = info
	}

	getPlayerInfo() {
		return this.playerInfo
	}
}