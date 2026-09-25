# Proguard rules for SolariX Mobile
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.solarix.mobile.data.remote.dtos.** { *; }
-keep class com.solarix.mobile.data.local.entities.** { *; }
