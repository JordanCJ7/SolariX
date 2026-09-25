package com.solarix.mobile.data.remote

import android.content.Context
import com.google.gson.Gson
import com.google.gson.JsonObject
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Singleton Retrofit client factory providing OkHttp logging, JWT authentication interceptor,
 * and standard server error message extraction.
 */
object RetrofitClient {

    // Default base URL targeting the IIS / Kestrel backend on the host machine from the Android emulator
    private const val DEFAULT_BASE_URL = "http://10.0.2.2:5000/api/"

    @Volatile
    private var apiService: ApiService? = null

    @Volatile
    private var currentBaseUrl: String = DEFAULT_BASE_URL

    fun setBaseUrl(newBaseUrl: String) {
        currentBaseUrl = if (newBaseUrl.endsWith("/")) newBaseUrl else "$newBaseUrl/"
        apiService = null // Force recreation on URL change
    }

    fun getBaseUrl(): String = currentBaseUrl

    fun getService(context: Context): ApiService {
        return apiService ?: synchronized(this) {
            apiService ?: buildRetrofit(context.applicationContext).create(ApiService::class.java).also {
                apiService = it
            }
        }
    }

    private fun buildRetrofit(context: Context): Retrofit {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(context))
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(currentBaseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    /**
     * Extracts user-readable error messages returned by the FAT service in 400/404/500 responses.
     */
    fun parseErrorMessage(response: Response<*>): String {
        return try {
            val errorBody = response.errorBody()?.string()
            if (!errorBody.isNullOrBlank()) {
                val json = Gson().fromJson(errorBody, JsonObject::class.java)
                when {
                    json.has("message") -> json.get("message").asString
                    json.has("error") -> json.get("error").asString
                    json.has("title") -> json.get("title").asString
                    else -> errorBody
                }
            } else {
                "HTTP ${response.code()}: ${response.message()}"
            }
        } catch (e: Exception) {
            "Error: ${e.localizedMessage ?: "Unexpected server error"}"
        }
    }
}
