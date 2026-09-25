package com.solarix.mobile.utils

import android.content.Context
import android.content.SharedPreferences
import com.solarix.mobile.data.local.AppDatabase
import com.solarix.mobile.data.local.entities.UserEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Manages the current user session state, bridging local SQLite persistence (Room)
 * and lightweight credentials for fast interceptor access.
 */
class SessionManager(private val context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("solarix_session_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_TOKEN = "jwt_token"
        private const val KEY_NIC = "user_nic"
        private const val KEY_ROLE = "user_role"
        private const val KEY_NAME = "user_full_name"
        private const val KEY_STATUS = "user_status"
        private const val KEY_EMAIL = "user_email"

        @Volatile
        private var INSTANCE: SessionManager? = null

        fun getInstance(context: Context): SessionManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SessionManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    fun saveSession(
        token: String,
        nic: String,
        role: String,
        fullName: String,
        email: String,
        status: String
    ) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_NIC, nic)
            .putString(KEY_ROLE, role)
            .putString(KEY_NAME, fullName)
            .putString(KEY_EMAIL, email)
            .putString(KEY_STATUS, status)
            .apply()
    }

    suspend fun saveFullUserSession(user: UserEntity) {
        saveSession(
            token = user.token,
            nic = user.nic,
            role = user.role,
            fullName = user.fullName,
            email = user.email,
            status = user.status
        )
        withContext(Dispatchers.IO) {
            AppDatabase.getDatabase(context).userDao().insertOrUpdate(user)
        }
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun getUserNic(): String? = prefs.getString(KEY_NIC, null)

    fun getUserRole(): String? = prefs.getString(KEY_ROLE, null)

    fun getUserFullName(): String? = prefs.getString(KEY_NAME, null)

    fun getUserEmail(): String? = prefs.getString(KEY_EMAIL, null)

    fun getUserStatus(): String? = prefs.getString(KEY_STATUS, null)

    fun isLoggedIn(): Boolean = !getToken().isNullOrBlank()

    suspend fun clearSession() {
        val currentNic = getUserNic()
        prefs.edit().clear().apply()
        withContext(Dispatchers.IO) {
            if (!currentNic.isNullOrBlank()) {
                AppDatabase.getDatabase(context).bookingDao().clearBookingsForProsumer(currentNic)
            }
            AppDatabase.getDatabase(context).userDao().clearAll()
        }
    }
}
