package com.madhuja.tracko;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;

public class TrackoWidgetProvider extends AppWidgetProvider {

    private int color(String value, int fallback) {
        try { return Color.parseColor(value); } catch (Exception e) { return fallback; }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        SharedPreferences prefs =
            context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String streak = prefs.getString("widget_streak", "0");
        String name = prefs.getString("widget_name", "");
        int bg = color(prefs.getString("widget_bg", "#F4C6CB"), 0xFFF4C6CB);
        int text = color(prefs.getString("widget_text", "#4A2B33"), 0xFF4A2B33);

        int s = 0;
        try { s = Integer.parseInt(streak); } catch (Exception e) { }
        String who = name.isEmpty() ? "" : ", " + name;
        String big = "🔥 " + s;
        String greeting = s == 0 ? "Tick a task to start 🌱"
            : s < 7 ? "Blooming" + who + " 🌸"
            : "Unstoppable" + who + " 🔥";

        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.tracko_widget);
            views.setTextViewText(R.id.widget_streak, big);
            views.setTextViewText(R.id.widget_greeting, greeting);
            views.setTextColor(R.id.widget_streak, text);
            views.setTextColor(R.id.widget_greeting, text);
            views.setInt(R.id.widget_bg, "setColorFilter", bg);

            Intent intent = new Intent(context, MainActivity.class);
            PendingIntent pi = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pi);

            manager.updateAppWidget(id, views);
        }
    }
}