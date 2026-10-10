package com.solarix.mobile.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.solarix.mobile.data.local.entities.CachedStationEntity

@Dao
interface StationDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(stations: List<CachedStationEntity>)

    @Query("SELECT * FROM cached_stations")
    suspend fun getAllStations(): List<CachedStationEntity>

    @Query("DELETE FROM cached_stations")
    suspend fun clearAll()
}
