import React, { useEffect, useState, useRef, useMemo } from "react"
import { useLocation } from "@reach/router"
import styles from "./tryForFreeModal.module.scss"
import CloseButton from "../components/closeButton"
import Button from "./button"
import onlineMeetingIcon from "../images/index/online-meeting.svg"
import downloadIcon from "../images/index/download.svg"
import successIcon from "../images/index/success_message.svg"
import ReactCountryFlag from "react-country-flag"
import axios from "axios"
import { navigate, graphql } from "gatsby"
import spinnerImg from "../images/blog/spinner.svg"
import { closeModal } from "../services/modal"

const Option = ({
  icon,
  title,
  description,
  buttonLabel,
  action,
  hideOnMobile,
}) => (
  <div
    className={
      hideOnMobile
        ? [styles.optionWrapper, styles.hideOnMobile].join(" ")
        : styles.optionWrapper
    }
  >
    <div className={styles.optionDetails}>
      <div className={styles.imageWrapper}>
        <img src={icon} />
      </div>
      <div className={styles.optionTexts}>
        <h3>{title}</h3>
        {description}
      </div>
    </div>
    {buttonLabel && (
      <Button
        type="button"
        classStyle={[styles.buttonComponent, styles.secondary].join(" ")}
        onClick={action}
      >
        {buttonLabel}
      </Button>
    )}
  </div>
)

const Success = ({ translations, languageCode }) => (
  <div className={styles.successWrapper}>
    <div className={styles.successDetails}>
      <img src={successIcon} alt="success" />
      <h3>{translations.thank_you}</h3>
      <p>
        <b>{translations.we_will_get_back}</b>
      </p>
      <p>
        {translations.contact_us_at}{" "}
        <a href="mailto:support@sidelinesports.com">
          support@sidelinesports.com
        </a>
      </p>
    </div>
    <Button
      type="button"
      classStyle={styles.buttonComponent}
      anchor={`https://xps.sidelinesports.com/${languageCode}/tutorials`}
      target={"_blank"}
    >
      {translations.find_out_more}
    </Button>
  </div>
)

const Divider = ({ translations }) => (
  <div className={styles.divider}>
    <span>{translations.or}</span>
  </div>
)

const CountrySelect = ({ value, onChange, name, translations }) => {
  const sortedCountryCodes = Object.keys(countries).sort((a, b) =>
    translations.countries[a].localeCompare(translations.countries[b])
  )
  return (
    <div className={styles.countrySelect}>
      <div className={styles.countryFlagWrapper}>
        <ReactCountryFlag
          countryCode={value}
          svg
          cdnUrl="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.4.3/flags/1x1/"
          cdnSuffix="svg"
          style={{
            width: "20px",
            height: "20px",
          }}
        />
      </div>
      <select name={name} value={value} onChange={onChange}>
        {sortedCountryCodes.map((k) => (
          <option value={k}>{translations.countries[k]}</option>
        ))}
      </select>
    </div>
  )
}

const PhoneInput = ({
  placeholder,
  phoneValue,
  countryValue,
  onPhoneChange,
  onCountryChange,
  inputStyle,
  translations,
}) => {
  const sortedCountryCodes = Object.keys(countries).sort((a, b) =>
    translations.countries[a].localeCompare(translations.countries[b])
  )
  return (
    <div style={inputStyle} className={styles.phoneInput}>
      <div className={styles.phoneCountryWrapper}>
        <p>+{countries[countryValue].code}</p>
        <ReactCountryFlag
          countryCode={countryValue}
          svg
          cdnUrl="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.4.3/flags/1x1/"
          cdnSuffix="svg"
          style={{
            width: "20px",
            height: "20px",
          }}
        />
        <select
          name="country"
          value={countryValue}
          onChange={onCountryChange}
          autoComplete="false"
        >
          {sortedCountryCodes.map((k) => (
            <option value={k} selected={k === countryValue}>
              {translations.countries[k]}
            </option>
          ))}
        </select>
      </div>
      <input
        type="tel"
        name="phone"
        placeholder={placeholder}
        value={phoneValue}
        onChange={onPhoneChange}
        autoComplete="false"
      />
    </div>
  )
}

const FreeTrialForm = ({ translations, defaultCountry }) => {
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    phone: "",
    country: defaultCountry || "GB",
    state: "",
    role: "",
    sport: "",
    username: "",
    password: "",
    confirmPassword: "",
  })

  const [isLoading, setIsLoading] = useState(false)

  const [failureTextForUser, setFailureTextForUser] = useState("")

  const usernameRef = useRef(null)

  const [validationTexts, setValidationTexts] = useState({})

  const [isRegistrationDisplayed, setIsRegistrationDisplayed] = useState(false)

  const handleChange = (e) => {
    e.persist()
    setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validate = async () => {
    let result = {}
    if (isRegistrationDisplayed) {
      if (!formValues.username) {
        result.username = `${translations.username} ${translations.is_missing}`
      }
      if (!formValues.password) {
        result.password = `${translations.password} ${translations.is_missing}`
      } else if (!/(?=.*\d).{8,}/.test(formValues.password)) {
        result.password = `${translations.password} ${translations.is_not_valid}`
      }
      if (!formValues.confirmPassword) {
        result.confirmPassword = `${translations.password_confirmation} ${translations.is_missing}`
      } else if (formValues.password !== formValues.confirmPassword) {
        result.confirmPassword = `${translations.password_confirmation} ${translations.does_not_match}`
      }
    } else {
      if (!formValues.name) {
        result.name = `${translations.name} ${translations.is_missing}`
      }
      if (!formValues.email) {
        result.email = `${translations.email} ${translations.is_missing}`
      } else if (
        !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formValues.email)
      ) {
        result.email = `${translations.email} ${translations.is_not_valid}`
      } else {
        const emailValidation = await checkEmail(translations)
        if (emailValidation) {
          result.email = emailValidation
        }
      }
      if (!formValues.phone) {
        result.phone = `${translations.phone} ${translations.is_missing}`
      } else if (!/^[0-9| ]*$/.test(formValues.phone)) {
        result.phone = `${translations.phone} ${translations.is_not_valid}`
      }
      if (formValues.country === "US" && !formValues.state) {
        result.state = `${translations.state} ${translations.is_missing}`
      }
      if (!formValues.sport && !["6", "7", "8"].includes(formValues.role)) {
        result.sport = `${translations.sport} ${translations.is_missing}`
      }
      if (!formValues.role) {
        result.role = `${translations.role} ${translations.is_missing}`
      }
    }
    setValidationTexts(result)
    return Object.keys(result).length === 0
  }

  const goToRegistration = async () => {
    setIsLoading(true)
    if (await validate()) {
      setIsRegistrationDisplayed(true)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (isRegistrationDisplayed) {
      usernameRef.current.focus()
    }
  }, [isRegistrationDisplayed])

  const submit = async () => {
    setIsLoading(true)
    if (await validate()) {
      const name = formValues.name
      let firstname = ""
      let lastname = ""
      if (name.match(/\S\s\S/)) {
        let ns = name.split(" ")
        firstname = ns.slice(0, ns.length - 1).join(" ")
        lastname = ns[ns.length - 1]
      } else {
        firstname = name
        lastname = formValues.role === "8" ? "Athlete" : "Trainer"
      }

      const result = await axios.post(
        "https://www4.sidelinesports.com/xpsweb/?json=is.sideline.apps.xps.server.web.json.messages.TrialRequest&charset=UTF-8&gzip=false",
        {
          _rolename: formValues.role,
          _usertype: formValues.role !== "8" ? 9 : 10,
          _firstname: firstname,
          _lastname: lastname,
          _lname: formValues.username,
          _account: "2513173816573179904",
          _role:
            formValues.role === "8"
              ? "5143014745869004800"
              : "1467792245501917184",
          _expiredays: formValues.role === "8" ? 8 : 21,
          _iscrippled: 1,
          _languagecode: navigator.language.slice(0, 2),
          _isteamsport: teamsports.includes(formValues.sport) ? 1 : 0,
          _email: formValues.email,
          _country: countries[formValues.country]?.name,
          _state: formValues.state,
          _phone: formValues.phone,
          _sport: formValues.role !== "8" ? formValues.sport : null,
          _registerToEmails: false,
          _pass: formValues.password,
        }
      )
      if (result.status === 200) {
        if (result.data._failureTextForUser) {
          setFailureTextForUser(result.data._failureTextForUser)
        } else {
          setFailureTextForUser("")
          navigate("/downloads")
        }
      }
    }
    setIsLoading(false)
  }

  const checkEmail = async (translations) => {
    let result = null
    try {
      result = await axios.post(
        "https://www4.sidelinesports.com/xpsweb/?json=is.sideline.apps.xps.server.web.json.messages.JsonEmailAvailabilityQuery&charset=UTF-8&gzip=false",
        {
          _email: formValues.email,
          _userType: formValues.role === "8" ? 10 : 9,
          _cripple: 1,
        }
      )
    } catch (error) {
      console.log(error)
    }
    return result.status !== 200
      ? translations.email_verification_failed
      : result.data?._used
      ? translations.used_email
      : null
  }

  return (
    <div className={styles.formWrapper}>
      <form>
        <div className={styles.inputsWrapper}>
          <h3>
            {isRegistrationDisplayed
              ? translations.create_account
              : translations.start_free_trial}
          </h3>
          {isRegistrationDisplayed ? (
            <>
              <p>{translations.username}</p>
              <input
                type="text"
                name="username"
                placeholder="John_Reed"
                autoFocus
                value={formValues.username}
                onChange={handleChange}
                style={{
                  borderColor: validationTexts.username ? "red" : "transparent",
                }}
                ref={usernameRef}
              />
              <p className={styles.validationMessage}>
                {validationTexts.username}
              </p>
              <p>{translations.password}</p>
              <input
                type="password"
                name="password"
                placeholder={translations.password_placeholder}
                value={formValues.password}
                onChange={handleChange}
                style={{
                  borderColor: validationTexts.password ? "red" : "transparent",
                }}
              />
              <p className={styles.validationMessage}>
                {validationTexts.password}
              </p>
              <p className={styles.info}>{translations.password_hint}</p>
              <p>{translations.password_confirmation}</p>
              <input
                type="password"
                name="confirmPassword"
                placeholder={translations.password_confirmation_placeholder}
                value={formValues.confirmPassword}
                onChange={handleChange}
                style={{
                  borderColor: validationTexts.confirmPassword
                    ? "red"
                    : "transparent",
                }}
              />
              <p className={styles.validationMessage}>
                {validationTexts.confirmPassword}
              </p>
              <p className={styles.failureTextForUser}>{failureTextForUser}</p>
            </>
          ) : (
            <>
              <p>{translations.full_name}</p>
              <input
                type="text"
                name="name"
                autoFocus
                value={formValues.name}
                onChange={handleChange}
                style={{
                  borderColor: validationTexts.name ? "red" : "transparent",
                }}
              />
              <p className={styles.validationMessage}>{validationTexts.name}</p>
              <p>{translations.email}</p>
              <input
                type="text"
                name="email"
                value={formValues.email}
                onChange={handleChange}
                style={{
                  borderColor: validationTexts.email ? "red" : "transparent",
                }}
              />
              <p className={styles.validationMessage}>
                {validationTexts.email}
              </p>
              <p>{translations.phone}</p>
              <PhoneInput
                phoneValue={formValues.phone}
                countryValue={formValues.country}
                onPhoneChange={handleChange}
                onCountryChange={handleChange}
                translations={translations}
                inputStyle={{
                  borderColor: validationTexts.phone ? "red" : "#e6e8eb",
                }}
              />
              <p className={styles.validationMessage}>
                {validationTexts.phone}
              </p>
              {formValues.country === "US" && (
                <>
                  <p>{translations.state}</p>
                  <select
                    name="state"
                    value={formValues.state}
                    onChange={handleChange}
                    style={{
                      borderColor: validationTexts.state
                        ? "red"
                        : "transparent",
                    }}
                  >
                    <option value="" disabled selected>
                      {translations.state_placeholder}
                    </option>
                    {Object.keys(usStates).map((s, i) => (
                      <option value={usStates[s]} key={`state-${i}`}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <p className={styles.validationMessage}>
                    {validationTexts.state}
                  </p>
                </>
              )}
              <p>{translations.role}</p>
              <select
                name="role"
                value={formValues.role}
                onChange={handleChange}
                style={{
                  borderColor: validationTexts.role ? "red" : "transparent",
                }}
              >
                <option value="" disabled selected>
                  {translations.role_placeholder}
                </option>
                {translations.roles.map((r, i) => (
                  <option value={i + 1} key={`role-${i}`}>
                    {r}
                  </option>
                ))}
              </select>
              <p className={styles.validationMessage}>{validationTexts.role}</p>
              {!["6", "7", "8"].includes(formValues.role) && (
                <>
                  <p>{translations.sport}</p>
                  <select
                    name="sport"
                    value={formValues.sport}
                    onChange={handleChange}
                    style={{
                      borderColor: validationTexts.sport
                        ? "red"
                        : "transparent",
                    }}
                  >
                    <option value="" disabled selected>
                      {translations.sport_placeholder}
                    </option>
                    {Object.keys(sports).map((k, i) => (
                      <option key={`sport-${i}`} value={k}>
                        {translations.sports[sports[k]]}
                      </option>
                    ))}
                  </select>
                  <p className={styles.validationMessage}>
                    {validationTexts.sport}
                  </p>
                </>
              )}
            </>
          )}
        </div>
        <Button
          type="button"
          classStyle={styles.buttonComponent}
          onClick={() =>
            isRegistrationDisplayed ? submit() : goToRegistration()
          }
          disabled={isLoading}
        >
          {isLoading ? (
            <img src={spinnerImg} className={styles.spinner} />
          ) : isRegistrationDisplayed ? (
            translations.create_and_download
          ) : (
            translations.start_free_trial_now
          )}
        </Button>
      </form>
    </div>
  )
}

const DemoForm = ({ onSubmit, languageCode, translations, defaultCountry }) => {
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    sport: "",
    organization: "",
    country: defaultCountry || "GB",
    state: "",
  })
  const [validationTexts, setValidationTexts] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    e.persist()
    setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    let result = {}
    if (!formValues.name) {
      result.name = `${translations.full_name} ${translations.is_missing}`
    }
    if (!formValues.email) {
      result.email = `${translations.email} ${translations.is_missing}`
    } else if (
      !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formValues.email)
    ) {
      result.email = `${translations.email} ${translations.is_not_valid}`
    }
    if (!formValues.organization) {
      result.organization = `${translations.organization} ${translations.is_missing}`
    }
    if (!formValues.sport) {
      result.sport = `${translations.sport} ${translations.is_missing}`
    }
    if (formValues.country === "US" && !formValues.state) {
      result.state = `${translations.state} ${translations.is_missing}`
    }
    setValidationTexts(result)
    return Object.keys(result).length === 0
  }

  const submit = async () => {
    if (validate()) {
      setIsLoading(true)
      try {
        const result = await axios.post(
          "https://wvahbngl31.execute-api.eu-central-1.amazonaws.com/requestDemoFromCountryManager",
          {
            location: window.location.href,
            name: formValues.name,
            email: formValues.email,
            message: "Request for XPS Demo",
            sport: formValues.sport,
            organization: formValues.organization,
            country: countries[formValues.country].name,
            state: formValues.state,
            language: languageCode,
          }
        )
        if (result.status === 200) {
          onSubmit()
        }
      } catch (error) {
        console.log(error)
      }
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.formWrapper}>
      <form>
        <div className={styles.inputsWrapper}>
          <h3>{translations.get_demo}</h3>
          <p>{translations.full_name}</p>
          <input
            name="name"
            type="text"
            autoFocus
            value={formValues.name}
            onChange={handleChange}
            style={{
              borderColor: validationTexts.name ? "red" : "transparent",
            }}
          />
          <p className={styles.validationMessage}>{validationTexts.name}</p>
          <p>{translations.email}</p>
          <input
            name="email"
            type="text"
            value={formValues.email}
            onChange={handleChange}
            style={{
              borderColor: validationTexts.email ? "red" : "transparent",
            }}
          />
          <p className={styles.validationMessage}>{validationTexts.email}</p>
          <p>{translations.organization}</p>
          <input
            name="organization"
            type="text"
            value={formValues.organization}
            onChange={handleChange}
            style={{
              borderColor: validationTexts.organization ? "red" : "transparent",
            }}
          />
          <p className={styles.validationMessage}>
            {validationTexts.organization}
          </p>
          <p>{translations.sport}</p>
          <select
            name="sport"
            onChange={handleChange}
            style={{
              borderColor: validationTexts.sport ? "red" : "transparent",
            }}
          >
            <option value="" disabled selected>
              {translations.sport_placeholder}
            </option>
            {Object.keys(sports).map((k) => (
              <option value={k}>{translations.sports[sports[k]]}</option>
            ))}
          </select>
          <p className={styles.validationMessage}>{validationTexts.sport}</p>
          <p>{translations.country}</p>
          <CountrySelect
            name="country"
            value={formValues.country}
            onChange={handleChange}
            translations={translations}
          />
          {formValues.country === "US" && (
            <>
              <p>{translations.state}</p>
              <select
                name="state"
                value={formValues.state}
                onChange={handleChange}
                style={{
                  borderColor: validationTexts.state ? "red" : "transparent",
                }}
              >
                <option value="" disabled selected>
                  {translations.state_placeholder}
                </option>
                {Object.keys(usStates).map((s, i) => (
                  <option value={usStates[s]} key={`state-${i}`}>
                    {s}
                  </option>
                ))}
              </select>
              <p className={styles.validationMessage}>
                {validationTexts.state}
              </p>
            </>
          )}
        </div>
        <Button
          type="button"
          classStyle={styles.buttonComponent}
          onClick={() => submit()}
          disabled={isLoading}
        >
          {isLoading ? (
            <img src={spinnerImg} className={styles.spinner} />
          ) : (
            translations.get_demo_now
          )}
        </Button>
      </form>
    </div>
  )
}

const TryForFreeModal = ({ languageCode, translations }) => {
  const { href } = useLocation()
  const isModalOpen = useMemo(
    () => href ? (new URL(href)).searchParams.get("modal") === "open" : false,
    [href]
  )
  const [activeSection, setActiveSection] = useState("")
  const [currentCountry, setCurrentCountry] = useState("")
  const fetchCountry = async () => {
    try {
      const res = await axios.get("https://ipapi.co/json/")
      if (res.status === 200) {
        setCurrentCountry(res.data?.country?.toUpperCase())
      } else {
        setCurrentCountry()
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!isModalOpen) {
      setActiveSection("")
    } else {
      if (!currentCountry) {
        fetchCountry()
      }
      const html = document.querySelector("html")
      html.style.overflow = "hidden"
      return () => (html.style.overflow = "visible")
    }
  }, [isModalOpen])

  const translateDescription = (description) => {
    let splitted = description.split(/<1>/)
    return (
      <>
        {splitted[0]} <span>{splitted[1]}</span> {splitted[2]}
      </>
    )
  }

  return isModalOpen ? (
    <div className={styles.modalWrapper}>
      <div className={styles.modal}>
        <CloseButton onClick={closeModal} />
        {!activeSection ? (
          <div className={styles.content}>
            <Option
              icon={onlineMeetingIcon}
              title={translations.get_demo}
              description={
                <p>{translateDescription(translations.get_demo_description)}</p>
              }
              buttonLabel={translations.schedule_meeting}
              action={() => setActiveSection("demo")}
            />
            <Divider translations={translations} />
            <Option
              icon={downloadIcon}
              title={translations.start_free_trial}
              description={
                <p>
                  {translateDescription(
                    translations.start_free_trial_description
                  )}
                </p>
              }
              buttonLabel={translations.start_free_trial_now}
              action={() => setActiveSection("free-trial")}
            />
          </div>
        ) : activeSection === "demo" ? (
          <div className={styles.content}>
            <Option
              icon={onlineMeetingIcon}
              title={translations.get_demo}
              description={
                <p>{translateDescription(translations.get_demo_description)}</p>
              }
              hideOnMobile
            />
            <DemoForm
              onSubmit={() => setActiveSection("thank-you")}
              languageCode={languageCode}
              translations={translations}
              defaultCountry={currentCountry}
            />
          </div>
        ) : activeSection === "free-trial" ? (
          <div className={styles.content}>
            <Option
              icon={downloadIcon}
              title={translations.start_free_trial}
              description={
                <p>
                  {translateDescription(
                    translations.start_free_trial_description
                  )}
                </p>
              }
              hideOnMobile
            />
            <FreeTrialForm
              translations={translations}
              defaultCountry={currentCountry}
            />
          </div>
        ) : (
          <div className={styles.content}>
            <Success translations={translations} languageCode={languageCode} />
          </div>
        )}
      </div>
    </div>
  ) : null
}

const sports = {
  ["American Football"]: "american_football",
  ["Archery"]: "archery",
  ["Badminton"]: "badminton",
  ["Bandy"]: "bandy",
  ["Baseball"]: "baseball",
  ["Basketball"]: "basketball",
  ["Bowling"]: "bowling",
  ["Boxing"]: "boxing",
  ["Cricket"]: "cricket",
  ["Curling"]: "curling",
  ["Cycling"]: "cycling",
  ["Dancing"]: "dancing",
  ["Equestrian"]: "equestrian",
  ["Esports"]: "esports",
  ["Fencing"]: "fencing",
  ["Field Hockey"]: "field_hockey",
  ["Figure Skating"]: "figure_skating",
  ["Floorball"]: "floorball",
  ["Soccer"]: "soccer",
  ["Futsal"]: "futsal",
  ["Golf"]: "golf",
  ["Gymnastics"]: "gymnastics",
  ["Handball"]: "handball",
  ["Ice Hockey"]: "ice_hockey",
  ["Judo"]: "judo",
  ["Lacrosse"]: "lacrosse",
  ["Martial Arts"]: "martial_arts",
  ["Motorsport"]: "motorsport",
  ["Netball"]: "netball",
  ["Padel"]: "padel",
  ["Physical Training"]: "physical_training",
  ["Powerlifting"]: "powerlifting",
  ["Rugby"]: "rugby",
  ["Sailing"]: "sailing",
  ["Shooting"]: "shooting",
  ["Skating"]: "skating",
  ["Skiing"]: "skiing",
  ["Softball"]: "softball",
  ["Squash"]: "squash",
  ["Swimming"]: "swimming",
  ["Table Tennis"]: "table_tennis",
  ["Taekwondo"]: "taekwondo",
  ["Tennis"]: "tennis",
  ["Track and Field"]: "track_and_field",
  ["Triathlon"]: "triathlon",
  ["Volleyball"]: "volleyball",
  ["Water Polo"]: "water_polo",
  ["Weightlifting"]: "weightlifting",
  ["Wrestling"]: "wrestling",
}

const teamsports = [
  "American Football",
  "Badminton",
  "Bandy",
  "Baseball",
  "Basketball",
  "Cricket",
  "Curling",
  "Esports",
  "Field Hockey",
  "Floorball",
  "Futsal",
  "Handball",
  "Ice Hockey",
  "Indoor Bandy",
  "Lacrosse",
  "Netball",
  "Padel",
  "Rugby",
  "Soccer",
  "Softball",
  "Squash",
  "Volleyball",
  "Water Polo",
]

const countries = {
  BD: {
    name: "Bangladesh",
    code: "880",
  },
  BE: {
    name: "Belgium",
    code: "32",
  },
  BF: {
    name: "Burkina Faso",
    code: "226",
  },
  BG: {
    name: "Bulgaria",
    code: "359",
  },
  BA: {
    name: "Bosnia and Herzegovina",
    code: "387",
  },
  BB: {
    name: "Barbados",
    code: "1",
  },
  WF: {
    name: "Wallis and Futuna",
    code: "681",
  },
  BL: {
    name: "Saint Barthelemy",
    code: "590",
  },
  BM: {
    name: "Bermuda",
    code: "1",
  },
  BN: {
    name: "Brunei",
    code: "673",
  },
  BO: {
    name: "Bolivia",
    code: "591",
  },
  BH: {
    name: "Bahrain",
    code: "973",
  },
  BI: {
    name: "Burundi",
    code: "257",
  },
  BJ: {
    name: "Benin",
    code: "229",
  },
  BT: {
    name: "Bhutan",
    code: "975",
  },
  JM: {
    name: "Jamaica",
    code: "1",
  },
  BV: {
    name: "Bouvet Island",
    code: "47",
  },
  BW: {
    name: "Botswana",
    code: "267",
  },
  WS: {
    name: "Samoa",
    code: "685",
  },
  BQ: {
    name: "Bonaire, Saint Eustatius and Saba ",
    code: "599",
  },
  BR: {
    name: "Brazil",
    code: "55",
  },
  BS: {
    name: "Bahamas",
    code: "1",
  },
  JE: {
    name: "Jersey",
    code: "44",
  },
  BY: {
    name: "Belarus",
    code: "375",
  },
  BZ: {
    name: "Belize",
    code: "501",
  },
  RU: {
    name: "Russia",
    code: "7",
  },
  RW: {
    name: "Rwanda",
    code: "250",
  },
  RS: {
    name: "Serbia",
    code: "381",
  },
  TL: {
    name: "East Timor",
    code: "670",
  },
  RE: {
    name: "Reunion",
    code: "262",
  },
  TM: {
    name: "Turkmenistan",
    code: "993",
  },
  TJ: {
    name: "Tajikistan",
    code: "992",
  },
  RO: {
    name: "Romania",
    code: "40",
  },
  TK: {
    name: "Tokelau",
    code: "690",
  },
  GW: {
    name: "Guinea-Bissau",
    code: "245",
  },
  GU: {
    name: "Guam",
    code: "1",
  },
  GT: {
    name: "Guatemala",
    code: "502",
  },
  GS: {
    name: "South Georgia and the South Sandwich Islands",
    code: "500",
  },
  GR: {
    name: "Greece",
    code: "30",
  },
  GQ: {
    name: "Equatorial Guinea",
    code: "240",
  },
  GP: {
    name: "Guadeloupe",
    code: "590",
  },
  JP: {
    name: "Japan",
    code: "81",
  },
  GY: {
    name: "Guyana",
    code: "592",
  },
  GG: {
    name: "Guernsey",
    code: "44",
  },
  GF: {
    name: "French Guiana",
    code: "594",
  },
  GE: {
    name: "Georgia",
    code: "995",
  },
  GD: {
    name: "Grenada",
    code: "1",
  },
  GB: {
    name: "United Kingdom",
    code: "44",
  },
  GA: {
    name: "Gabon",
    code: "241",
  },
  SV: {
    name: "El Salvador",
    code: "503",
  },
  GN: {
    name: "Guinea",
    code: "224",
  },
  GM: {
    name: "Gambia",
    code: "220",
  },
  GL: {
    name: "Greenland",
    code: "299",
  },
  GI: {
    name: "Gibraltar",
    code: "350",
  },
  GH: {
    name: "Ghana",
    code: "233",
  },
  OM: {
    name: "Oman",
    code: "968",
  },
  TN: {
    name: "Tunisia",
    code: "216",
  },
  JO: {
    name: "Jordan",
    code: "962",
  },
  HR: {
    name: "Croatia",
    code: "385",
  },
  HT: {
    name: "Haiti",
    code: "509",
  },
  HU: {
    name: "Hungary",
    code: "36",
  },
  HK: {
    name: "Hong Kong",
    code: "852",
  },
  HN: {
    name: "Honduras",
    code: "504",
  },
  HM: {
    name: "Heard Island and McDonald Islands",
    code: " ",
  },
  VE: {
    name: "Venezuela",
    code: "58",
  },
  PR: {
    name: "Puerto Rico",
    code: "1",
  },
  PS: {
    name: "Palestinian Territory",
    code: "970",
  },
  PW: {
    name: "Palau",
    code: "680",
  },
  PT: {
    name: "Portugal",
    code: "351",
  },
  SJ: {
    name: "Svalbard and Jan Mayen",
    code: "47",
  },
  PY: {
    name: "Paraguay",
    code: "595",
  },
  IQ: {
    name: "Iraq",
    code: "964",
  },
  PA: {
    name: "Panama",
    code: "507",
  },
  PF: {
    name: "French Polynesia",
    code: "689",
  },
  PG: {
    name: "Papua New Guinea",
    code: "675",
  },
  PE: {
    name: "Peru",
    code: "51",
  },
  PK: {
    name: "Pakistan",
    code: "92",
  },
  PH: {
    name: "Philippines",
    code: "63",
  },
  PN: {
    name: "Pitcairn",
    code: "870",
  },
  PL: {
    name: "Poland",
    code: "48",
  },
  PM: {
    name: "Saint Pierre and Miquelon",
    code: "508",
  },
  ZM: {
    name: "Zambia",
    code: "260",
  },
  EH: {
    name: "Western Sahara",
    code: "212",
  },
  EE: {
    name: "Estonia",
    code: "372",
  },
  EG: {
    name: "Egypt",
    code: "20",
  },
  ZA: {
    name: "South Africa",
    code: "27",
  },
  EC: {
    name: "Ecuador",
    code: "593",
  },
  IT: {
    name: "Italy",
    code: "39",
  },
  VN: {
    name: "Vietnam",
    code: "84",
  },
  SB: {
    name: "Solomon Islands",
    code: "677",
  },
  ET: {
    name: "Ethiopia",
    code: "251",
  },
  SO: {
    name: "Somalia",
    code: "252",
  },
  ZW: {
    name: "Zimbabwe",
    code: "263",
  },
  SA: {
    name: "Saudi Arabia",
    code: "966",
  },
  ES: {
    name: "Spain",
    code: "34",
  },
  ER: {
    name: "Eritrea",
    code: "291",
  },
  ME: {
    name: "Montenegro",
    code: "382",
  },
  MD: {
    name: "Moldova",
    code: "373",
  },
  MG: {
    name: "Madagascar",
    code: "261",
  },
  MF: {
    name: "Saint Martin",
    code: "590",
  },
  MA: {
    name: "Morocco",
    code: "212",
  },
  MC: {
    name: "Monaco",
    code: "377",
  },
  UZ: {
    name: "Uzbekistan",
    code: "998",
  },
  MM: {
    name: "Myanmar",
    code: "95",
  },
  ML: {
    name: "Mali",
    code: "223",
  },
  MO: {
    name: "Macao",
    code: "853",
  },
  MN: {
    name: "Mongolia",
    code: "976",
  },
  MH: {
    name: "Marshall Islands",
    code: "692",
  },
  MK: {
    name: "Macedonia",
    code: "389",
  },
  MU: {
    name: "Mauritius",
    code: "230",
  },
  MT: {
    name: "Malta",
    code: "356",
  },
  MW: {
    name: "Malawi",
    code: "265",
  },
  MV: {
    name: "Maldives",
    code: "960",
  },
  MQ: {
    name: "Martinique",
    code: "596",
  },
  MP: {
    name: "Northern Mariana Islands",
    code: "1",
  },
  MS: {
    name: "Montserrat",
    code: "1",
  },
  MR: {
    name: "Mauritania",
    code: "222",
  },
  IM: {
    name: "Isle of Man",
    code: "44",
  },
  UG: {
    name: "Uganda",
    code: "256",
  },
  TZ: {
    name: "Tanzania",
    code: "255",
  },
  MY: {
    name: "Malaysia",
    code: "60",
  },
  MX: {
    name: "Mexico",
    code: "52",
  },
  IL: {
    name: "Israel",
    code: "972",
  },
  FR: {
    name: "France",
    code: "33",
  },
  IO: {
    name: "British Indian Ocean Territory",
    code: "246",
  },
  SH: {
    name: "Saint Helena",
    code: "290",
  },
  FI: {
    name: "Finland",
    code: "358",
  },
  FJ: {
    name: "Fiji",
    code: "679",
  },
  FK: {
    name: "Falkland Islands",
    code: "500",
  },
  FM: {
    name: "Micronesia",
    code: "691",
  },
  FO: {
    name: "Faroe Islands",
    code: "298",
  },
  NI: {
    name: "Nicaragua",
    code: "505",
  },
  NL: {
    name: "Netherlands",
    code: "31",
  },
  NO: {
    name: "Norway",
    code: "47",
  },
  NA: {
    name: "Namibia",
    code: "264",
  },
  VU: {
    name: "Vanuatu",
    code: "678",
  },
  NC: {
    name: "New Caledonia",
    code: "687",
  },
  NE: {
    name: "Niger",
    code: "227",
  },
  NF: {
    name: "Norfolk Island",
    code: "672",
  },
  NG: {
    name: "Nigeria",
    code: "234",
  },
  NZ: {
    name: "New Zealand",
    code: "64",
  },
  NP: {
    name: "Nepal",
    code: "977",
  },
  NR: {
    name: "Nauru",
    code: "674",
  },
  NU: {
    name: "Niue",
    code: "683",
  },
  CK: {
    name: "Cook Islands",
    code: "682",
  },
  XK: {
    name: "Kosovo",
    code: "383",
  },
  CI: {
    name: "Ivory Coast",
    code: "225",
  },
  CH: {
    name: "Switzerland",
    code: "41",
  },
  CO: {
    name: "Colombia",
    code: "57",
  },
  CN: {
    name: "China",
    code: "86",
  },
  CM: {
    name: "Cameroon",
    code: "237",
  },
  CL: {
    name: "Chile",
    code: "56",
  },
  CC: {
    name: "Cocos Islands",
    code: "61",
  },
  CA: {
    name: "Canada",
    code: "1",
  },
  CG: {
    name: "Republic of the Congo",
    code: "242",
  },
  CF: {
    name: "Central African Republic",
    code: "236",
  },
  CD: {
    name: "Democratic Republic of the Congo",
    code: "243",
  },
  CZ: {
    name: "Czech Republic",
    code: "420",
  },
  CY: {
    name: "Cyprus",
    code: "357",
  },
  CX: {
    name: "Christmas Island",
    code: "61",
  },
  CR: {
    name: "Costa Rica",
    code: "506",
  },
  CW: {
    name: "Curacao",
    code: "599",
  },
  CV: {
    name: "Cape Verde",
    code: "238",
  },
  CU: {
    name: "Cuba",
    code: "53",
  },
  SZ: {
    name: "Swaziland",
    code: "268",
  },
  SY: {
    name: "Syria",
    code: "963",
  },
  SX: {
    name: "Sint Maarten",
    code: "599",
  },
  KG: {
    name: "Kyrgyzstan",
    code: "996",
  },
  KE: {
    name: "Kenya",
    code: "254",
  },
  SS: {
    name: "South Sudan",
    code: "211",
  },
  SR: {
    name: "Suriname",
    code: "597",
  },
  KI: {
    name: "Kiribati",
    code: "686",
  },
  KH: {
    name: "Cambodia",
    code: "855",
  },
  KN: {
    name: "Saint Kitts and Nevis",
    code: "1",
  },
  KM: {
    name: "Comoros",
    code: "269",
  },
  ST: {
    name: "Sao Tome and Principe",
    code: "239",
  },
  SK: {
    name: "Slovakia",
    code: "421",
  },
  KR: {
    name: "South Korea",
    code: "82",
  },
  SI: {
    name: "Slovenia",
    code: "386",
  },
  KP: {
    name: "North Korea",
    code: "850",
  },
  KW: {
    name: "Kuwait",
    code: "965",
  },
  SN: {
    name: "Senegal",
    code: "221",
  },
  SM: {
    name: "San Marino",
    code: "378",
  },
  SL: {
    name: "Sierra Leone",
    code: "232",
  },
  SC: {
    name: "Seychelles",
    code: "248",
  },
  KZ: {
    name: "Kazakhstan",
    code: "7",
  },
  KY: {
    name: "Cayman Islands",
    code: "1",
  },
  SG: {
    name: "Singapore",
    code: "65",
  },
  SE: {
    name: "Sweden",
    code: "46",
  },
  SD: {
    name: "Sudan",
    code: "249",
  },
  DO: {
    name: "Dominican Republic",
    code: "1",
  },
  DM: {
    name: "Dominica",
    code: "1",
  },
  DJ: {
    name: "Djibouti",
    code: "253",
  },
  DK: {
    name: "Denmark",
    code: "45",
  },
  VG: {
    name: "British Virgin Islands",
    code: "1",
  },
  DE: {
    name: "Germany",
    code: "49",
  },
  YE: {
    name: "Yemen",
    code: "967",
  },
  DZ: {
    name: "Algeria",
    code: "213",
  },
  US: {
    name: "United States",
    code: "1",
  },
  UY: {
    name: "Uruguay",
    code: "598",
  },
  YT: {
    name: "Mayotte",
    code: "262",
  },
  UM: {
    name: "United States Minor Outlying Islands",
    code: "1",
  },
  LB: {
    name: "Lebanon",
    code: "961",
  },
  LC: {
    name: "Saint Lucia",
    code: "1",
  },
  LA: {
    name: "Laos",
    code: "856",
  },
  TV: {
    name: "Tuvalu",
    code: "688",
  },
  TW: {
    name: "Taiwan",
    code: "886",
  },
  TT: {
    name: "Trinidad and Tobago",
    code: "1",
  },
  TR: {
    name: "Turkey",
    code: "90",
  },
  LK: {
    name: "Sri Lanka",
    code: "94",
  },
  LI: {
    name: "Liechtenstein",
    code: "423",
  },
  LV: {
    name: "Latvia",
    code: "371",
  },
  TO: {
    name: "Tonga",
    code: "676",
  },
  LT: {
    name: "Lithuania",
    code: "370",
  },
  LU: {
    name: "Luxembourg",
    code: "352",
  },
  LR: {
    name: "Liberia",
    code: "231",
  },
  LS: {
    name: "Lesotho",
    code: "266",
  },
  TH: {
    name: "Thailand",
    code: "66",
  },
  TF: {
    name: "French Southern Territories",
    code: "262",
  },
  TG: {
    name: "Togo",
    code: "228",
  },
  TD: {
    name: "Chad",
    code: "235",
  },
  TC: {
    name: "Turks and Caicos Islands",
    code: "1",
  },
  LY: {
    name: "Libya",
    code: "218",
  },
  VA: {
    name: "Vatican",
    code: "379",
  },
  VC: {
    name: "Saint Vincent and the Grenadines",
    code: "1",
  },
  AE: {
    name: "United Arab Emirates",
    code: "971",
  },
  AD: {
    name: "Andorra",
    code: "376",
  },
  AG: {
    name: "Antigua and Barbuda",
    code: "1",
  },
  AF: {
    name: "Afghanistan",
    code: "93",
  },
  AI: {
    name: "Anguilla",
    code: "1",
  },
  VI: {
    name: "U.S. Virgin Islands",
    code: "1",
  },
  IS: {
    name: "Iceland",
    code: "354",
  },
  IR: {
    name: "Iran",
    code: "98",
  },
  AM: {
    name: "Armenia",
    code: "374",
  },
  AL: {
    name: "Albania",
    code: "355",
  },
  AO: {
    name: "Angola",
    code: "244",
  },
  AQ: {
    name: "Antarctica",
    code: "672",
  },
  AS: {
    name: "American Samoa",
    code: "1",
  },
  AR: {
    name: "Argentina",
    code: "54",
  },
  AU: {
    name: "Australia",
    code: "61",
  },
  AT: {
    name: "Austria",
    code: "43",
  },
  AW: {
    name: "Aruba",
    code: "297",
  },
  IN: {
    name: "India",
    code: "91",
  },
  AX: {
    name: "Aland Islands",
    code: "358",
  },
  AZ: {
    name: "Azerbaijan",
    code: "994",
  },
  IE: {
    name: "Ireland",
    code: "353",
  },
  ID: {
    name: "Indonesia",
    code: "62",
  },
  UA: {
    name: "Ukraine",
    code: "380",
  },
  QA: {
    name: "Qatar",
    code: "974",
  },
  MZ: {
    name: "Mozambique",
    code: "258",
  },
}

const usStates = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  "District Of Columbia": "DC",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Puerto Rico": "PR",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
}

export default TryForFreeModal

export const query = graphql`
  fragment TryXpsModalTranslations on TextsYaml {
    try_xps_modal {
      thank_you
      we_will_get_back
      contact_us_at
      find_out_more
      or
      create_account
      start_free_trial
      start_free_trial_now
      start_free_trial_description
      get_demo
      get_demo_now
      get_demo_description
      create_and_download
      schedule_meeting
      username
      password
      password_placeholder
      password_confirmation
      password_confirmation_placeholder
      name
      phone
      full_name
      email
      organization
      role
      role_placeholder
      sport
      sport_placeholder
      country
      state
      state_placeholder
      is_missing
      is_not_valid
      does_not_match
      password_hint
      email_verification_failed
      used_email
      roles
      sports {
        american_football
        archery
        badminton
        bandy
        baseball
        basketball
        bowling
        boxing
        cricket
        curling
        cycling
        dancing
        equestrian
        esports
        fencing
        field_hockey
        figure_skating
        floorball
        soccer
        futsal
        golf
        gymnastics
        handball
        ice_hockey
        judo
        lacrosse
        martial_arts
        motorsport
        netball
        padel
        physical_training
        powerlifting
        rugby
        sailing
        shooting
        skating
        skiing
        softball
        squash
        swimming
        table_tennis
        taekwondo
        tennis
        track_and_field
        triathlon
        volleyball
        water_polo
        weightlifting
        wrestling
      }
      countries {
        BD
        BE
        BF
        BG
        BA
        BB
        WF
        BL
        BM
        BN
        BO
        BH
        BI
        BJ
        BT
        JM
        BV
        BW
        WS
        BQ
        BR
        BS
        JE
        BY
        BZ
        RU
        RW
        RS
        TL
        RE
        TM
        TJ
        RO
        TK
        GW
        GU
        GT
        GS
        GR
        GQ
        GP
        JP
        GY
        GG
        GF
        GE
        GD
        GB
        GA
        SV
        GN
        GM
        GL
        GI
        GH
        OM
        TN
        JO
        HR
        HT
        HU
        HK
        HN
        HM
        VE
        PR
        PS
        PW
        PT
        SJ
        PY
        IQ
        PA
        PF
        PG
        PE
        PK
        PH
        PN
        PL
        PM
        ZM
        EH
        EE
        EG
        ZA
        EC
        IT
        VN
        SB
        ET
        SO
        ZW
        SA
        ES
        ER
        ME
        MD
        MG
        MF
        MA
        MC
        UZ
        MM
        ML
        MO
        MN
        MH
        MK
        MU
        MT
        MW
        MV
        MQ
        MP
        MS
        MR
        IM
        UG
        TZ
        MY
        MX
        IL
        FR
        IO
        SH
        FI
        FJ
        FK
        FM
        FO
        NI
        NL
        NO
        NA
        VU
        NC
        NE
        NF
        NG
        NZ
        NP
        NR
        NU
        CK
        XK
        CI
        CH
        CO
        CN
        CM
        CL
        CC
        CA
        CG
        CF
        CD
        CZ
        CY
        CX
        CR
        CW
        CV
        CU
        SZ
        SY
        SX
        KG
        KE
        SS
        SR
        KI
        KH
        KN
        KM
        ST
        SK
        KR
        SI
        KP
        KW
        SN
        SM
        SL
        SC
        KZ
        KY
        SG
        SE
        SD
        DO
        DM
        DJ
        DK
        VG
        DE
        YE
        DZ
        US
        UY
        YT
        UM
        LB
        LC
        LA
        TV
        TW
        TT
        TR
        LK
        LI
        LV
        TO
        LT
        LU
        LR
        LS
        TH
        TF
        TG
        TD
        TC
        LY
        VA
        VC
        AE
        AD
        AG
        AF
        AI
        VI
        IS
        IR
        AM
        AL
        AO
        AQ
        AS
        AR
        AU
        AT
        AW
        IN
        AX
        AZ
        IE
        ID
        UA
        QA
        MZ
      }
    }
  }
`
