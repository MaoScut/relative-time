# relative-time设计文档

## 目的
解决‘最近1天’, ‘最近5分钟’等相对时间的计算和展示问题

## api设计
```ts

interface IRelativeTime {
  type: 'abs'| 'rel'
}

```

## TODO
1. 给出ui组件
