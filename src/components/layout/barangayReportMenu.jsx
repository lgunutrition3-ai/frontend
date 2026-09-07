import { FaBaby, FaWater, FaFileAlt, FaSeedling, FaPiggyBank, FaPaw, FaUserMd, FaList, FaStore, FaAppleAlt, FaTint, FaLeaf } from 'react-icons/fa'

export const barangayReportMenuItems = [
  {
    section: 'Nutrition Reports',
    items: [
      {
        path: '/barangay-report',
        icon: <FaAppleAlt />,
        label: 'Vitamin A Report'
      },
      {
        path: '/barangay-report/pregnant-women',
        icon: <FaUserMd />,
        label: 'Pregnant Women BMI'
      }
    ]
  },
  {
    section: 'Livelihood Reports',
    items: [
      {
        path: '/barangay-report/animal-raising',
        icon: <FaPiggyBank />,
        label: 'Animal Raising'
      },
      {
        path: '/barangay-report/animal-dispersal',
        icon: <FaPaw />,
        label: 'Animal Dispersal'
      },
      {
        path: '/barangay-report/backyard-gardening',
        icon: <FaSeedling />,
        label: 'Backyard Gardening'
      },
      {
        path: '/barangay-report/vegetable-seeds',
        icon: <FaLeaf />,
        label: 'Vegetable Seeds'
      }
    ]
  },
  {
    section: 'Infrastructure Reports',
    items: [
      {
        path: '/barangay-report/potable-water',
        icon: <FaTint />,
        label: 'Potable Water'
      },
      {
        path: '/barangay-report/iodized-salt',
        icon: <FaStore />,
        label: 'Iodized Salt Stores'
      },
      {
        path: '/barangay-report/cr',
        icon: <FaFileAlt />,
        label: 'With & Without CR'
      }
    ]
  }
]