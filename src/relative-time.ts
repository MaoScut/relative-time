import { Dayjs, OpUnitType } from "dayjs"

export interface IRelativeTimeOptions {
  // /**
  //  * 哪一天是一周的第一天, 默认值是false
  //  */
  // firstDayIsSunday: boolean
  /**
   * 计算end时间戳时, 若超过当前时间, 是否强制截断, 默认为true
   */
  forceUntilNow: boolean
  /**
   * key解析出错的时候将使用该值
   */
  fallbackRelativeTime: IRelativeTime
}

export enum RelativeTimeUnit {
  min = 'Min',
  hour = 'Hour',
  day = 'Day',
  week = 'Week',
  month = 'Month',
  year = 'Year'
}

export enum ReferenceTime {
  now = 'now',
  today = 'today',
  thisWeek = 'thisWeek',
  thisMonth = 'thisMonth',
  thisYear = 'thisYear'
}

class Encoder {
  private keyValidReg = new RegExp(
    `unit=(${unitAvailable})&count=(-?\\d+)&referenceTime=(${relativeTimeRefAvailable})`
  )

  generateKey(unit: string, count: number, referenceTime: string) {
    return `unit=(${unit})&count=(${count})&referenceTime=(${referenceTime})`
  }

  parse(s: string) {
    const matchResult = s.match(this.keyValidReg)
    if (!matchResult) {
      console.warn('fail to parse key ' + s)
      return null
    }
    const [, unit, count, referenceTime] = matchResult
    return {
      unit: unit as RelativeTimeUnit,
      count: Number(count),
      referenceTime: referenceTime as ReferenceTime
    }
  }
}

const encoder = new Encoder()

export function relativeTimeFactory (p: Omit<IRelativeTime, 'key'>): IRelativeTime {
  const key = encoder.generateKey(p.unit, p.count, p.referenceTime)
  return {
    key,
    ...p
  }
}

export const todayRelativeTime = relativeTimeFactory({
  count: 1,
  unit: RelativeTimeUnit.day,
  referenceTime: ReferenceTime.today
})

export const thisWeekRelativeTime = relativeTimeFactory({
  count: 1,
  unit: RelativeTimeUnit.week,
  referenceTime: ReferenceTime.thisWeek
})

export const thisMonthRelativeTime = relativeTimeFactory({
  count: 1,
  unit: RelativeTimeUnit.month,
  referenceTime: ReferenceTime.thisMonth
})

const unitAvailable = Object.values(RelativeTimeUnit).join('|')
const relativeTimeRefAvailable = Object.values(ReferenceTime).join('|')
export const keyValidReg = new RegExp(
  `unit=(${unitAvailable})&count=(-?\\d+)&referenceTime=(${relativeTimeRefAvailable})`
)

export const defaultRelativeTimeOptions: IRelativeTimeOptions = {
  forceUntilNow: true,
  // firstDayIsSunday: false,
  fallbackRelativeTime: todayRelativeTime
}
export class RelativeTime {
  private readonly options: IRelativeTimeOptions
  constructor(p?: Partial<IRelativeTimeOptions>) {
    this.options = {
      ...defaultRelativeTimeOptions,
      ...p
    }
  }

  public parse(s: string) {
    const result = encoder.parse(s)
    if (!result) {
      console.warn('fail to parse key ' + s + ', use fall back time: ', this.options.fallbackRelativeTime)
    }
    const matchResult = s.match(keyValidReg)
    if (!matchResult) {
      return this.options.fallbackRelativeTime
    }
    return {
      ...result,
      key: s
    }
  }

  public getTimeRange(key: string) {
    const obj = this.parse(key)
    const referenceTime = this.getRefTime(obj.referenceTime)
    let offsetTime = new Dayjs()
    const stepMap: {
      [key in RelativeTimeUnit]: OpUnitType
    } = {
      [RelativeTimeUnit.min]: 'minutes',
      [RelativeTimeUnit.hour]: 'hours',
      [RelativeTimeUnit.day]: 'days',
      [RelativeTimeUnit.week]: 'weeks',
      [RelativeTimeUnit.month]: 'months',
      [RelativeTimeUnit.year]: 'years'
    }
    offsetTime = offsetTime.subtract(obj.count, stepMap[obj.unit])
    const startTime = Math.min(offsetTime.valueOf(), referenceTime.valueOf())
    const endTime = Math.max(offsetTime.valueOf(), referenceTime.valueOf())
    return {
      startTime,
      endTime
    }
  }

  private getRefTime (s: string) {
    const now = new Dayjs()
    switch (s) {
      case ReferenceTime.now: {
        return now
      }
      case ReferenceTime.today: {
        return now.startOf('day')
      }
      case ReferenceTime.thisWeek: {
        // TODO: 这是周日还是周一?
        return now.startOf('week')
      }
      case ReferenceTime.thisMonth: {
        return now.startOf('month')
      }
      case ReferenceTime.thisYear: {
        return now.startOf('year')
      }
      default:
        console.warn('undefined reference time ' + s + ' use ' + ReferenceTime.now)
        return now
    }
  }

  public getDisplayName (key: string): string {
    const relTime = this.parse(key)
    if (relTime.referenceTime === ReferenceTime.now) {
      let str = `Last ${-relTime.count} `
      const isPlural = -relTime.count > 1
      const labelMap = {
        [RelativeTimeUnit.min]: 'Min',
        [RelativeTimeUnit.hour]: 'Hour',
        [RelativeTimeUnit.day]: 'Day',
        [RelativeTimeUnit.week]: 'Week',
        [RelativeTimeUnit.month]: 'Month',
        [RelativeTimeUnit.year]: 'Year'
      }
      str += labelMap[relTime.unit]
      if (isPlural) {
        str += 's'
      }
      return str
    }
    if (relTime.key === todayRelativeTime.key) {
      return 'Today'
    }
    if (relTime.key === thisWeekRelativeTime.key) {
      return 'This Week'
    }
    if (relTime.key === thisMonthRelativeTime.key) {
      return 'This Month'
    }
    return 'Unknown time'
  }
}



interface IRelativeTime {
  key: string
  unit: RelativeTimeUnit
  referenceTime: ReferenceTime
  count: number
}
