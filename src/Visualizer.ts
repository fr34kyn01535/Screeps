import "./RoomVisual"
import * as _ from "lodash"
const textColor = '#c9c9c9';
const textSize = .8;
const charWidth = textSize * 0.4;
const charHeight = textSize * 0.9;
 
const colors = {
	gray: '#555555',
	light: '#AAAAAA',
	road: '#666', // >:D
	energy: '#FFE87B',
	power: '#F53547',
	dark: '#181818',
	outline: '#8FBB93',
	speechText: '#000000',
	speechBackground: '#2ccf3b'
}
	
	interface Coord {
		x: number;
		y: number;
	}
	export interface BuildingPlannerOutput { 
		name: string;
		shard: string;
		rcl: string;
		buildings: { [structureType: string]: { pos: Coord[] } };
	}
	
	export interface StructureLayout {
		[rcl: number]: BuildingPlannerOutput | undefined;
	
		data: {
			anchor: Coord;
			pointsOfInterest?: {
				[pointLabel: string]: Coord;
			}
		}
	}
export interface StructureMap {
	[structureType: string]: RoomPosition[];
}

export const asciiLogo: string[] =
				 ['   ad88       ad888888b,         ,d8   88                                  ,a8888a,        88 8888888888   ad888888b, 8888888888 ',
			' 	d8"        d8"     "88       ,d888   88                                ,8P"`  `"Y8,    ,d88 88          d8"     "88 88           ',
			'	 88                 a8P     ,d8" 88   88                               ,8P        Y8, 888888 88  ____            a8P 88  ____     ',
			'MM88MMM 8b,dP     aad8"    ,d8"   88   88   ,d8  8b      d8 8b,dPPYba,  88         88      88 88a8PPPP8b,      aad8"  88a8PPPP8b,  ',
			'	88    88P`       ""Y8,  ,d8"     88   88 ,a8"  ``8b    d8` 88P`   `"8a 88         88      88 PP"     `8b      ""Y8,  PP"     `8b  ',
			' 	88    88           "8b 8888888888888 8888[     `8b   d8`  88       88 `8b        d8`     88          d8         "8b          d8  ',
			' 	88    88   Y8,     a88          88   88`"Yba,   `8b,d8`   88       88  `8ba,  ,ad8`      88 Y8a     a8P Y8,     a88 Y8a     a8P  ',
			'	 88    88    "Y888888P`          88   88   `Y8a    Y88`    88       88    "Y8888P"        88  "Y88888P"   "Y888888P`  "Y88888P"   ',
			'																					                        						 d8`        ',                                                                    
			'																						                         				d8`  '
		];



export default class Visualizer {

	private static textStyle(size = 1, style: TextStyle = {}) {
		return _.defaults(style, {
			color  : textColor,
			align  : 'left',
			font   : `${size * textSize} Trebuchet MS`,
			opacity: 0.8,
		});
	}

	static circle(pos: RoomPosition, color = 'red', opts = {}): RoomVisual {
		_.defaults(opts, {
			fill   : color,
			radius : 0.35,
			opacity: 0.5,
		});
		return new RoomVisual(pos.roomName).circle(pos.x, pos.y, opts);
	}

	static marker(pos: RoomPosition, opts : any): RoomVisual {
		return (<any>new RoomVisual(pos.roomName)).animatedPosition(pos.x, pos.y, opts);
	}

	static drawStructureMap(structureMap: StructureMap): void {
		let vis: { [roomName: string]: RoomVisual } = {};
		for (let structureType in structureMap) {
			for (let pos of structureMap[structureType]) {
				if (!vis[pos.roomName]) {
					vis[pos.roomName] = new RoomVisual(pos.roomName);
				}
				(<any>vis[pos.roomName]).structure(pos.x, pos.y, structureType);
			}
		}
		for (let roomName in vis) {
			(<any>vis[roomName]).connectRoads();
		}
	}

	static drawLayout(layout: StructureLayout, anchor: RoomPosition, opts = {}): void {
		_.defaults(opts, {opacity: 0.5});
		let vis = new RoomVisual(anchor.roomName);
		for (let structureType in layout[8]!.buildings) {
			for (let pos of layout[8]!.buildings[structureType].pos) {
				let dx = pos.x - layout.data.anchor.x;
				let dy = pos.y - layout.data.anchor.y;
				(<any>vis).structure(anchor.x + dx, anchor.y + dy, structureType, opts);
			}
		}
		(<any>vis).connectRoads(opts);
	}

	static drawRoads(positoins: RoomPosition[]): void {
		let pointsByRoom = _.groupBy(positoins, pos => pos.roomName);
		for (let roomName in pointsByRoom) {
			let vis = new RoomVisual(roomName);
			for (let pos of pointsByRoom[roomName]) {
				(<any>vis).structure(pos.x, pos.y, STRUCTURE_ROAD);
			}
			(<any>vis).connectRoads();
		}
	}

	static drawPath(path: RoomPosition[], style?: PolyStyle): void {
		let pointsByRoom = _.groupBy(path, pos => pos.roomName);
		for (let roomName in pointsByRoom) {
			new RoomVisual(roomName).poly(pointsByRoom[roomName], style);
		}
	}

	static showInfo(info: string[], calledFrom: { room: Room | undefined, pos: RoomPosition }, opts = {}): RoomVisual {
		if (calledFrom.room) {
			return (<any>calledFrom.room.visual).infoBox(info, calledFrom.pos.x, calledFrom.pos.y, opts);
		} else {
			return (<any>new RoomVisual(calledFrom.pos.roomName)).infoBox(info, calledFrom.pos.x, calledFrom.pos.y, opts);
		}
	}

	static section(title: string, pos: { x: number, y: number, roomName?: string }, width: number,
				   height: number): { x: number, y: number } {
		const vis = new RoomVisual(pos.roomName);
		vis.rect(pos.x, pos.y - charHeight, width, 1.1 * charHeight, {opacity: 0.15});
		(<any>vis).box(pos.x, pos.y - charHeight, width, height + (1.1 + .25) * charHeight, {color: textColor});
		vis.text(title, pos.x + .25, pos.y - .05, this.textStyle());
		return {x: pos.x + 0.25, y: pos.y + 1.1 * charHeight};
	}

	static infoBox(header: string, content: string[] | string[][], pos: { x: number, y: number, roomName?: string },
				   width: number): number {
		// const vis = new RoomVisual(pos.roomName);
		// vis.rect(pos.x, pos.y - charHeight, width, 1.1 * charHeight, {opacity: 0.15});
		// vis.box(pos.x, pos.y - charHeight, width, ((content.length || 1) + 1.1 + .25) * charHeight,
		// 		{color: textColor});
		// vis.text(header, pos.x + .25, pos.y - .05, this.textStyle());
		let height = charHeight * (content.length || 1);
		let {x, y} = this.section(header, pos, width, height);
		if (content.length > 0) {
			if (_.isArray(content[0])) {
				this.table(<string[][]>content, {
					x       : x,
					y       : y,
					roomName: pos.roomName
				});
			} else {
				this.multitext(<string[]>content, {
					x       : x,
					y       : y,
					roomName: pos.roomName
				});
			}
		}
		// return pos.y - charHeight + ((content.length || 1) + 1.1 + .25) * charHeight + 0.1;
		const spaceBuffer = 0.5;
		return y + height + spaceBuffer;
	}

	static text(text: string, pos: { x: number, y: number, roomName?: string }, size = 1, style: TextStyle = {}): void {
		new RoomVisual(pos.roomName).text(text, pos.x, pos.y, this.textStyle(size, style));
	}

	static barGraph(progress: number | [number, number], pos: { x: number, y: number, roomName?: string },
					width = 7, scale = 1): void {
		const vis = new RoomVisual(pos.roomName);
		let percent: number;
		let mode: 'percent' | 'fraction';
		if (typeof progress === 'number') {
			percent = progress;
			mode = 'percent';
		} else {
			percent = progress[0] / progress[1];
			mode = 'fraction';
		}
		// Draw frame
		(<any>vis).box(pos.x, pos.y - charHeight * scale, width, 1.1 * scale * charHeight, {color: textColor});
		vis.rect(pos.x, pos.y - charHeight * scale, percent * width, 1.1 * scale * charHeight, {
			fill       : textColor,
			opacity    : 0.4,
			strokeWidth: 0
		});
		// Draw text
		if (mode == 'percent') {
			vis.text(`${Math.round(100 * percent)}%`, pos.x + width / 2, pos.y - .1 * charHeight,
					 this.textStyle(1, {align: 'center'}));
		} else {
			let [num, den] = <[number, number]>progress;
			vis.text(`${num}/${den}`, pos.x + width / 2, pos.y - .1 * charHeight,
					 this.textStyle(1, {align: 'center'}));
		}

	}

	static table(data: string[][], pos: { x: number, y: number, roomName?: string }): void {
		if (data.length == 0) {
			return;
		}
		const colPadding = 4;
		const vis = new RoomVisual(pos.roomName);

		const style = this.textStyle();

		// Determine column locations
		let columns = Array((<string[]>_.first(data)).length).fill(0);
		for (let entries of data) {
			for (let i = 0; i < entries.length - 1; i++) {
				columns[i] = Math.max(columns[i], entries[i].length);
			}
		}

		// // Draw header and underline
		// vis.text(header, pos.x, pos.y, style);
		// vis.line(pos.x, pos.y + .3 * charHeight,
		// 	pos.x + charWidth * _.sum(columns) + colPadding * columns.length, pos.y + .25 * charHeight, {
		// 			 color: textColor
		// 		 });

		// Draw text
		// let dy = 1.5 * charHeight;
		let dy = 0;
		for (let entries of data) {
			let dx = 0;
			for (let i in entries) {
				vis.text(entries[i], pos.x + dx, pos.y + dy, style);
				dx += charWidth * (columns[i] + colPadding);
			}
			dy += charHeight;
		}
	};

	static multitext(lines: string[], pos: { x: number, y: number, roomName?: string }): void {
		if (lines.length == 0) {
			return;
		}
		const vis = new RoomVisual(pos.roomName);
		const style = this.textStyle();
		// Draw text
		let dy = 0;
		for (let line of lines) {
			vis.text(line, pos.x, pos.y + dy, style);
			dy += charHeight;
		}
	};

	static drawHUD(): void {
		(<any>new RoomVisual()).multitext(asciiLogo, 1, 1, {textfont: 'monospace',textsize:0.3,opacity:0.6, color:"cyan"});
		//(<any>new RoomVisual()).text("Screeps AI V 1.0", 27, 3.1, {font: '1 monospace',opacity:0.6, color:"cyan"});
	}


	static drawNotifications(notificationMessages: string[]): void {
		// const vis = new RoomVisual();
		const x = 10.5;
		const y = 7;
		if (notificationMessages.length == 0) {
			notificationMessages = ['No notifications'];
		}
		const maxStringLength = <number>_.max(_.map(notificationMessages, msg => msg.length));
		const width = Math.max(11, 1.2 * charWidth * maxStringLength);
		this.infoBox('Notifications', notificationMessages, {x, y}, width);
	}

	// static colonyReport(colonyName: string, text: string[]) {
	// 	if (!this.enabled) return;
	// 	new RoomVisual(colonyName).multitext(text, 0, 4, {textfont: 'monospace', textsize: 0.75});
	// }

	static drawGraphs(): void {
		this.text(`CPU`, {x: 1, y: 7});
		this.barGraph(Game.cpu.getUsed() / Game.cpu.limit, {x: 2.75, y: 7});
		this.text(`BKT`, {x: 1, y: 8});
		this.barGraph(Game.cpu.bucket / 10000, {x: 2.75, y: 8});
		this.text(`GCL`, {x: 1, y: 9});
		this.barGraph(Game.gcl.progress / Game.gcl.progressTotal, {x: 2.75, y: 9});
	}

	static summary(): void {
		this.text(`Creeps: ${_.keys(Game.creeps).length}`, {
			x: 1,
			y: 10
		}, .93);
	}

	// This typically takes about 0.3-0.6 CPU in total
	static visuals(): void {
		this.drawHUD();
		//this.drawGraphs();
	  //this.drawNotifications(["test"]);
		//this.summary();
	}
}