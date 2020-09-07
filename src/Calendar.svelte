<script lang="ts">
  import moment from "moment";
  import type { Leaf, Vault } from "./obsidian";

  export let activeLeaf: Leaf = null;
  export let vault: Vault;
  export let onClick: (event: Event) => void;

  export let directory: string;
  export let format: string;

  const today = moment();
  const startDate = moment({ day: 1 });
  const activeFile = activeLeaf?.view.file?.path;

  let days = [];
  let offset = startDate.isoWeekday() + 1;
  let day = 1;
  for (let weekNum = 0; weekNum <= 5; weekNum++) {
    const daysInWeek = [];
    days.push(daysInWeek);

    for (let weekday = 1; weekday <= 7; weekday++) {
      // Insert empty objects for spacers
      if (weekNum * 6 + weekday < offset || day > startDate.daysInMonth()) {
        daysInWeek.push({});
        continue;
      }

      const { path } = vault.adapter;
      const formattedDate = `${moment({ day }).format(format)}.md`;
      const fileForDay = vault.getAbstractFileByPath(
        path.join(directory, formattedDate)
      );
      const fileSize = fileForDay?.stat?.size || 0;

      daysInWeek.push({
        dayOfMonth: day,
        formattedDate: `${moment({ day }).format(format)}.md`,
        isActiveFile: activeFile === formattedDate,
        numDots: fileSize ? Math.floor(Math.log(fileSize / 20)) : 0,
      });

      day++;
    }

    if (day >= startDate.daysInMonth()) {
      break;
    }
  }

  const monthName = moment().format("MMM YYYY");
</script>

<style>
  th,
  td {
    text-align: center;
  }

  .today {
    background: var(--purple);
  }

  .active {
    background: var(--red) !important;
    position: relative;
    z-index: 1;
  }

  .container {
    overflow-y: scroll;
    padding: 0 16px;
  }

  .table {
    border: solid 1px var(--dark0);
    border-collapse: collapse;
    width: 100%;
  }

  th {
    background-color: var(--dark0);
    padding: 8px;
  }

  td {
    cursor: pointer;
    border: solid 1px var(--dark0);
    font-size: 0.8em;
    padding: 8px;
  }
  td:empty {
    background-color: var(--dark2);
  }
  td:hover {
    background-color: var(--dark0);
  }

  .dot-container {
    line-height: 4px;
    zoom: 0.6;
  }

  .dot {
    border-radius: 100%;
    background: var(--frost2);
    width: 6px;
    height: 6px;
    display: inline-block;
    margin-right: 4px;
  }

  .dot:last-of-type {
    margin-right: 0;
  }
</style>

<div class="container">
  <h2>{monthName}</h2>
  <table class="table">
    <thead>
      <tr>
        <th>S</th>
        <th>M</th>
        <th>T</th>
        <th>W</th>
        <th>H</th>
        <th>F</th>
        <th>S</th>
      </tr>
    </thead>
    <tbody>
      {#each days as daysInWeek}
        <tr>
          {#each daysInWeek as { dayOfMonth, formattedDate, numDots }}
            {#if !dayOfMonth}
              <td />
            {:else}
              <td
                class:today={dayOfMonth === today}
                class:active={activeFile === formattedDate}
                on:click={onClick}>
                {dayOfMonth}

                <div class="dot-container">
                  {#each Array(numDots) as _}
                    <div class="dot" />
                  {/each}
                </div>
              </td>
            {/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
