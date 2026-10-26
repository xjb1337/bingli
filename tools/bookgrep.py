# -*- coding: utf-8 -*-
"""在教材 PDF 里按关键词检索，打印命中处的上下文。

用法：
    python tools/bookgrep.py 内科 消化性溃疡
    python tools/bookgrep.py 外科 阑尾炎 --pages 441-449
    python tools/bookgrep.py 内科 临床表现 --from 405 --to 410

为什么只给检索、不给整章 dump：
    内科 982 页、外科 834 页，整章导出动辄几万字，子代理读完就爆上下文。
    按关键词取几百字上下文，够判断「教材怎么写的」了。
"""
import argparse
import os
import sys

BOOKS = {
    '内科': r'D:\BaiduNetdiskDownload\21内科 第10版 .pdf',
    '外科': r'D:\BaiduNetdiskDownload\22外科 第10版.pdf',
    '诊断': r'D:\BaiduNetdiskDownload\19诊断 第10版.pdf',
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('book', choices=list(BOOKS))
    ap.add_argument('keyword')
    ap.add_argument('--pages', default='')
    ap.add_argument('--from', dest='pfrom', type=int, default=0)
    ap.add_argument('--to', dest='pto', type=int, default=0)
    ap.add_argument('--ctx', type=int, default=260, help='命中处前后各取多少字')
    ap.add_argument('--max', type=int, default=6, help='最多打印几处命中')
    args = ap.parse_args()

    import pymupdf  # noqa

    path = BOOKS[args.book]
    if not os.path.isfile(path):
        print('找不到：' + path)
        return 1

    doc = pymupdf.open(path)
    start, end = 0, doc.page_count
    if args.pages:
        a, _, b = args.pages.partition('-')
        start = max(0, int(a) - 1)
        end = min(doc.page_count, int(b or a))
    else:
        if args.pfrom:
            start = max(0, args.pfrom - 1)
        if args.pto:
            end = min(doc.page_count, args.pto)

    hits = 0
    for i in range(start, end):
        text = doc[i].get_text()
        pos = text.find(args.keyword)
        while pos >= 0 and hits < args.max:
            lo = max(0, pos - args.ctx)
            hi = min(len(text), pos + len(args.keyword) + args.ctx)
            print('----- 第 %d 页 -----' % (i + 1))
            print(text[lo:hi].replace('\n', ' '))
            print()
            hits += 1
            pos = text.find(args.keyword, pos + 1)
        if hits >= args.max:
            break
    if not hits:
        print('（未命中：%s / %s）' % (args.book, args.keyword))
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
