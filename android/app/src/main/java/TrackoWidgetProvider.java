package com.madhuja.tracko;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class TrackoWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        SharedPreferences prefs =
            context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String streak = prefs.getString("widget_streak", "0");
        String name = prefs.getString("widget_name", "");

        String big = "🔥 " + streak;
        String greeting = name.isEmpty() ? "Keep going!" : "Hey, " + name + ".";

        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.tracko_widget);
            views.setTextViewText(R.id.widget_streak, big);
            views.setTextViewText(R.id.widget_greeting, greeting);

            Intent intent = new Intent(context, MainActivity.class);
            PendingIntent pi = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pi);

            manager.updateAppWidget(id, views);
        }
    }
}