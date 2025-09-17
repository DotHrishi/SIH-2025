const FormSelection = ({ onSelectForm }) => {
  const formTypes = [
    {
      id: 'water',
      title: 'Water Quality Report',
      description: 'Submit water quality test results and contamination reports',
      icon: '💧',
      color: 'blue',
      features: [
        'Water quality parameters',
        'Contamination levels',
        'Location mapping',
        'Photo attachments'
      ]
    },
    {
      id: 'patient',
      title: 'Patient Health Report',
      description: 'Report waterborne illness cases and health incidents',
      icon: '🏥',
      color: 'green',
      features: [
        'Patient information',
        'Symptom tracking',
        'Medical history',
        'Treatment records'
      ]
    }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'bg-blue-100',
        button: 'bg-blue-600 hover:bg-blue-700',
        text: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'bg-green-100',
        button: 'bg-green-600 hover:bg-green-700',
        text: 'text-green-600'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {formTypes.map((formType) => {
          const colors = getColorClasses(formType.color);
          
          return (
            <div
              key={formType.id}
              className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:scale-105`}
            >
              <div className="text-center mb-6">
                <div className={`${colors.icon} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-2xl">{formType.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {formType.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {formType.description}
                </p>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Features:</h4>
                <ul className="space-y-2">
                  {formType.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <span className={`${colors.text} mr-2`}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onSelectForm(formType.id)}
                className={`w-full ${colors.button} text-white py-3 px-4 rounded-lg font-medium transition-colors`}
              >
                Start {formType.title}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-center mb-2">
            <span className="text-yellow-600 mr-2">ℹ️</span>
            <h4 className="font-semibold text-yellow-800">Important Information</h4>
          </div>
          <p className="text-sm text-yellow-700">
            All submitted forms will be reviewed by health officials and may be used for public health surveillance and response activities.
            Please ensure all information is accurate and complete.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FormSelection;