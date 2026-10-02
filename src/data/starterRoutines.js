export const GOALS = [
  {
    id: 'fitness',
    label: '💪 Fitness',
    tasks: ['Workout for 30 minutes', 'Walk for 20 minutes', 'Stretch for 10 minutes'],
  },
  {
    id: 'study',
    label: '📚 Study',
    tasks: ['Study 2 focused hours', "Revise today's notes", "Plan tomorrow's study"],
  },
  {
    id: 'money',
    label: '💰 Saving money',
    tasks: ["Note today's spending", 'Check my budget', 'No unplanned spending'],
  },
  {
    id: 'selfcare',
    label: '🌸 Self-care',
    tasks: ['Morning skincare', 'Drink 8 glasses of water', 'Sleep by 11 pm'],
  },
  {
    id: 'career',
    label: '🚀 Career / skills',
    tasks: ['Practice a skill for 1 hour', 'Learn something new for 20 minutes'],
  },
  {
    id: 'mindful',
    label: '🧘 Peace of mind',
    tasks: ['Meditate for 10 minutes', 'Write a gratitude note', 'One phone-free hour'],
  },
]

export function tasksForGoals(goalIds) {
  const all = GOALS.filter((g) => goalIds.includes(g.id)).flatMap((g) => g.tasks)
  return [...new Set(all)]
}