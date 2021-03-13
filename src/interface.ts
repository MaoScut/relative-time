export enum TimeType {
  abs = 'abs',
  rel = 'res'
}

export interface IBaseTime {
  start: number
  end: number
}

export interface IAbsTime extends IBaseTime {
  type: TimeType.abs
}

export interface IRelTime {
  type: TimeType.rel
  relativeTimeKey: string
}



export type ITime = IRelTime & IAbsTime

export declare function getTimeRange (t: ITime): IBaseTime


export class RelativeTime {}
