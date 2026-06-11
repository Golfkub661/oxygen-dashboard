'use client';

import { AreaChart, Divider, Card } from '@tremor/react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const data = [
  { date: 'Jan 23', 'This year': 10200, 'Last year': 3800 },
  { date: 'Feb 23', 'This year': 15100, 'Last year': 6910 },
  { date: 'Mar 23', 'This year': 16100, 'Last year': 7210 },
  { date: 'Apr 23', 'This year': 17100, 'Last year': 9200 },
  { date: 'May 23', 'This year': 24800, 'Last year': 9100 },
  { date: 'Jun 23', 'This year': 20500, 'Last year': 10210 },
  { date: 'Jul 23', 'This year': 22130, 'Last year': 10810 },
  { date: 'Aug 23', 'This year': 28100, 'Last year': 12120 },
  { date: 'Sep 23', 'This year': 31700, 'Last year': 10620 },
  { date: 'Oct 23', 'This year': 32230, 'Last year': 11350 },
  { date: 'Nov 23', 'This year': 42200, 'Last year': 12550 },
  { date: 'Dec 23', 'This year': 59100, 'Last year': 22150 },
];

const summary = [
  { name: 'This year', total: 277760, color: 'bg-blue-500' },
  { name: 'Last year', total: 120420, color: 'bg-violet-500' },
];

const valueFormatter = (number) =>
  `$${Intl.NumberFormat('us').format(number).toString()}`;

export default function WeatherRelationChart() {
  return (
    /* ปรับลดความกว้างลง 50% ด้วย w-1/2 (หรือพิกัดสูงสุดที่ sm:max-w-md สำหรับการ์ดขนาดเล็ก) */
    <Card className="mx-auto w-1/2 min-w-[320px] p-4">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <h3 className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Revenue
          </h3>
          <span className="mt-0.5 inline-flex rounded bg-emerald-100 px-1.5 py-0.5 text-tremor-label font-medium text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-400">
            +2.3%
          </span>
        </div>
        <p className="mt-1 text-tremor-default text-tremor-content dark:text-dark-tremor-content">
          Current year vs. same period last year
        </p>
        
        <Divider className="my-2" />
        
        <div className="flex items-center gap-6">
          {summary.map((category) => (
            <div key={category.name}>
              <div className="flex items-center space-x-2">
                <span
                  className={classNames(category.color, 'size-2 rounded-sm')}
                  aria-hidden={true}
                />
                <p className="text-tremor-label text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis">
                  {category.name}
                </p>
              </div>
              <p className="text-tremor-default font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                {valueFormatter(category.total)}
              </p>
            </div>
          ))}
        </div>

        {/* ปรับลดความสูงของบล็อกกราฟลง 50% โดยกำหนด h-24 (ประมาณ 96px) หรือ h-28 เพื่อให้สมดุลกับตัวอักษร */}
        <div className="mt-4 h-24 w-full">
          <AreaChart
            data={data}
            index="date"
            categories={['This year', 'Last year']}
            colors={['blue', 'violet']}
            valueFormatter={valueFormatter}
            showLegend={false}
            showYAxis={false}
            showGradient={false}
            startEndOnly={true}
            className="h-full w-full"
          />
        </div>
      </div>
    </Card>
  );
}