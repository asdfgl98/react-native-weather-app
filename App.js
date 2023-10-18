import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { Fontisto } from "@expo/vector-icons";
import { APP_ENV } from "@env";

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  BackHandler,
  Alert,
} from "react-native";

// 내 디바이스의 화면 크기 가져오는 API Dimension
// {width, heigth} 로 값을 가져올 수있음
// width: SCREEN_WIDTH width 객체 값을 SCREEN_WIDTH라는 이름으로 변경
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// https://openweathermap.org/ 에서 회원가입 후 API(무료) 발급 받기
const API_KEY = APP_ENV; // API 입력

// 위도 경도 값으로 받아온 지역의 날씨 정보 중 기상을 키 값으로 사용하여
// 해당하는 아이콘을 expo icon 홈페이지에서 불러오기 위해 정리한 객체
const icons = {
  Clouds: "cloudy",
  Clear: "day-sunny",
  Rain: "rain",
  Atmosphere: "fog",
  Snow: "snow",
  Drizzle: "rains",
  Thunderstorm: "lightning",
};

export default function App() {
  // 지역 정보 State
  const [city, setCity] = useState("Loading...");
  const [ok, setOk] = useState(null);
  const [days, setDays] = useState(null);

  // 날씨정보 가져오는 함수
  const getWeather = async () => {
    // 위치 권한 설정
    const { granted } = await Location.requestForegroundPermissionsAsync();
    // 거절
    if (!granted) {
      setOk(false);
      // 수락
    } else {
      setOk(true);
    }

    // 위치(경도, 위도) 정보인 latitude, longitude 가져오기
    // accuray : 1 ~ 6 정확도
    const {
      coords: { latitude, longitude },
    } = await Location.getCurrentPositionAsync({
      accuracy: 5,
    });

    // 위도와 경도를 입력하면 도시와 구역 등을 반환해주는 expo 함수이지만,
    // open weather api에서도 도시와 구역을 반환 받을 수 있기 때문에
    // 구현만하고 사용은 안함
    const location = await Location.reverseGeocodeAsync(
      { latitude, longitude },
      { useGoogleMaps: false }
    );

    // openweatherapi에 위도, 경도 값으로 해당 지역의 날씨정보, 지역이름 요청
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&exclude=alerts&appid=${API_KEY}&units=metric&lang=kr`
    );
    const json = await response.json();
    // 지역이름 state에 저장
    setCity(json.city.name);
    // 오늘 기준 5일동안의 예보를 3시간 간격으로 총 40개의 배열을 반환받음(3*8=24시간 중 5일이기때문에 총 40개의 데이터)
    // 매일 9시기준으로만 데이터를 받아오기 위해 for문으로 필터링하여 5개의 배열로 축소
    let day_list = [];
    for (let i = 0; i < 40; i += 8) {
      day_list.push(json.list[i]);
    }
    setDays(day_list);
  };

  // 앱 실행시 날씨정보 가져오는 함수 실행
  useEffect(() => {
    getWeather();
  }, []);

  // 위치 권한 설정 거절 시, 알림창 출력 및 어플 종료
  useEffect(() => {
    if (ok != null) {
      if (!ok) {
        Alert.alert("알림", "위치 권한 설정을 수락해주세요.", [
          { text: "OK", onPress: () => BackHandler.exitApp() },
        ]);
      }
    }
  }, [ok]);

  return (
    <View style={styles.container}>
      <View style={styles.city}>
        {/* 지역이름 */}
        <Text style={styles.cityname}>{city}</Text>
      </View>
      {/* ScrollView 정리 */}
      <ScrollView
        // horizontal : 세로 스크롤을 가로 스크롤로 변경
        horizontal
        // paginEnabled : 한 스크롤에 한개의 요소만 보이게 고정
        pagingEnabled
        // showHorizontalScrollIndicator : 하단의 스크롤 감추기 (false)
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weather}
      >
        {/* 기온, 기상 등을 담은 view */}
        {/* 날씨데이터를 api에서 받아오기 전이라면 로딩 아이콘 표시 */}
        {days === null ? (
          <View style={styles.day}>
            <ActivityIndicator
              color="white"
              style={{ marginTop: 10 }}
              size="large"
            />
          </View>
        ) : (
          // 응답받은 5일의 데이터를 map함수를 이용해 출력
          days.map((day, index) => (
            <View key={index} style={styles.day}>
              {/* 년월일 시간 데이터중 년월일 까지 표기 */}
              <Text style={styles.descripstion}>
                {day.dt_txt.substr(0, 10)}
              </Text>
              {/* 년월일 시간 데이터중 시간만 표기 */}
              <Text style={styles.descripstionTime}>
                오전 {day.dt_txt.substr(11, 2)}시
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                {/* 기온 소수점 1자리까지 표기 */}
                <Text style={styles.temp}>
                  {parseFloat(day.main.temp).toFixed(1)}
                </Text>
                {/* 기상에 따른 아이콘 표기 */}
                <Fontisto
                  name={icons[day.weather[0].main]}
                  size={68}
                  color="white"
                  style={{ marginRight: 20 }}
                />
              </View>
              {/* 기상을 텍스트로 표기 */}
              <Text style={styles.weather}>{day.weather[0].description}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// 스타일 지정
const styles = StyleSheet.create({
  // View 스타일 지정
  container: {
    flex: 1,
    backgroundColor: "tomato",
  },
  // View 스타일 지정
  city: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // 지역이름 스타일 지정
  cityname: {
    fontSize: 48,
    fontWeight: "600",
    color: "white",
  },
  // 기상정보 View 스타일 지정
  day: {
    // 날짜와 요일이 들어가는 View 탭 width 크기를
    // Dimesion 으로 디바이스 width값을 가져와서 넣어주기
    width: SCREEN_WIDTH,
    padding: 10,
  },
  // 온도 텍스트 스타일 지정
  temp: {
    fontSize: 100,
    fontWeight: "500",
    color: "white",
  },
  // 기상 년월일 텍스트 스타일 지정
  descripstion: {
    marginTop: 0,
    fontSize: 40,
    color: "white",
  },
  // 기상 시간 텍스트 스타일 지정
  descripstionTime: {
    marginTop: 10,
    fontSize: 25,
    color: "white",
  },
  // 기상 텍스트 스타일 지정
  weather: {
    fontSize: 30,
    color: "white",
    // marginLeft: 10,
  },
});
