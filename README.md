# Taskwarrior widget for Übersicht

Inspired by the original Taskwarrior Widget by Kevin Bockelandt (<https://github.com/KevinBockelandt/TaskwarriorWidget>), but enhanced and rewritten from scratch for Übersicht’s more recent React + JSX framework.

The widget displays a configurable number (default 20) of ready Taskwarrior tasks (i.e., those that have the `READY` virtual tag), sorted in descending order of urgency. The columns displayed are task ID, number of days to due date, description, project, tags, urgency, and a configurable indicator (default 🟊) of whether you’ve started a task.

Due and overdue tasks are highlighted using configurable colours.
