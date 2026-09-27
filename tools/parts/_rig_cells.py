[('rest', mk(sh + R.body() + upright(head()))),
 ('wave', mk(sh + R.body(arms=('wave','rest')) + upright(head('happy')))),
 ('wave up -18', mk(sh + R.body(arms=('wave','rest')).replace('class="m-arm-l"','class="m-arm-l" transform="rotate(18)"') + upright(head('happy')))),
 ('wave down +8', mk(sh + R.body(arms=('wave','rest')).replace('class="m-arm-l"','class="m-arm-l" transform="rotate(-8)"') + upright(head('happy')))),
 ('cheer', mk(sh + R.body(arms=('cheer','cheer')) + upright(head('happy')))),
 ('hold', mk(sh + R.body(arms=('rest','hold')) + upright(head()))),
 ('out', mk(sh + R.body(arms=('out','out')) + upright(head('surprised')))),
 ('down', mk(sh + R.body(arms=('down','down')) + upright(head()))),
]
