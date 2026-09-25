package com.solarix.mobile.data.repository

import android.content.Context
import com.solarix.mobile.data.local.AppDatabase
import com.solarix.mobile.data.local.entities.UserEntity
import com.solarix.mobile.data.remote.RetrofitClient
import com.solarix.mobile.data.remote.dtos.LoginRequest
import com.solarix.mobile.data.remote.dtos.LoginResponse
import com.solarix.mobile.data.remote.dtos.RegisterProsumerRequest
import com.solarix.mobile.data.remote.dtos.UpdateProfileRequest
import com.solarix.mobile.data.remote.dtos.UserResponse
import com.solarix.mobile.utils.SessionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository(private val context: Context) {
    private val api = RetrofitClient.getService(context)
    private val db = AppDatabase.getDatabase(context)
    private val session = SessionManager.getInstance(context)

    suspend fun login(identifier: String, password: String): Result<LoginResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.login(LoginRequest(identifier.trim(), password))
                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    val entity = UserEntity(
                        nic = body.nic,
                        fullName = body.fullName,
                        email = body.email,
                        role = body.role,
                        status = body.status,
                        token = body.token
                    )
                    session.saveFullUserSession(entity)
                    Result.success(body)
                } else {
                    val msg = RetrofitClient.parseErrorMessage(response)
                    Result.failure(Exception(msg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun registerProsumer(request: RegisterProsumerRequest): Result<UserResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.registerProsumer(request)
                if (response.isSuccessful && response.body() != null) {
                    Result.success(response.body()!!)
                } else {
                    val msg = RetrofitClient.parseErrorMessage(response)
                    Result.failure(Exception(msg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun getProfile(nic: String): Result<UserResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.getProfile(nic)
                if (response.isSuccessful && response.body() != null) {
                    val profile = response.body()!!
                    // Update SQLite cache
                    val existing = db.userDao().getUserByNic(nic)
                    if (existing != null) {
                        db.userDao().update(
                            existing.copy(
                                fullName = profile.fullName,
                                email = profile.email,
                                phoneNumber = profile.phoneNumber,
                                address = profile.address,
                                solarCapacityKW = profile.solarCapacityKW
                            )
                        )
                    }
                    Result.success(profile)
                } else {
                    val msg = RetrofitClient.parseErrorMessage(response)
                    Result.failure(Exception(msg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun updateProfile(nic: String, request: UpdateProfileRequest): Result<UserResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.updateProfile(nic, request)
                if (response.isSuccessful && response.body() != null) {
                    val updated = response.body()!!
                    val existing = db.userDao().getUserByNic(nic)
                    if (existing != null) {
                        db.userDao().update(
                            existing.copy(
                                fullName = updated.fullName,
                                phoneNumber = updated.phoneNumber,
                                address = updated.address,
                                solarCapacityKW = updated.solarCapacityKW
                            )
                        )
                    }
                    Result.success(updated)
                } else {
                    val msg = RetrofitClient.parseErrorMessage(response)
                    Result.failure(Exception(msg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun deactivateAccount(nic: String): Result<String> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.deactivateAccount(nic, requestedByNic = nic)
                if (response.isSuccessful) {
                    val msg = response.body()?.get("message") ?: "Account deactivated successfully."
                    session.clearSession()
                    Result.success(msg)
                } else {
                    val msg = RetrofitClient.parseErrorMessage(response)
                    Result.failure(Exception(msg))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun logout() {
        session.clearSession()
    }
}
